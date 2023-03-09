import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { DefaultAzureCredential } from "@azure/identity"
import { Deployment, ResourceManagementClient } from "@azure/arm-resources";

import * as redis from 'redis';

import { DeploymentRequest } from "./request";

const createCluster: AzureFunction = async (context: Context, req: HttpRequest): Promise<void> => {

    const azureSubscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
	const resourceGroup = process.env.DEPLOYMENT_RESOURCE_GROUP;

    const credential = new DefaultAzureCredential();
    const resourceClient = new ResourceManagementClient(credential, azureSubscriptionId);
	const redisClient = await getRedisClient(context);

	const deploymentRequest = req.body as DeploymentRequest;
	const template = getDeploymentTemplate(deploymentRequest);

	try {
		await redisClient.SET(deploymentRequest.name, JSON.stringify(deploymentRequest));
		await deployResource(deploymentRequest.name, resourceClient, template, resourceGroup);
		context.res = { status: 200, body: { message: "Cluster deployed successfuly" } };
	} catch(error) {
		context.log(error);
		await redisClient.DEL(deploymentRequest.name);
		context.res = { status: 500, body: { message: "Failed to deploy cluster" } };
	}
};

const getDeploymentTemplate = (req: DeploymentRequest) => ({
	$schema: "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
	contentVersion: "1.0.0.0",
	parameters: {},
	resources: [
		{
			type: "Microsoft.DBforPostgreSQL/serverGroupsv2",
			apiVersion: "2022-11-08",
			name: req.clusterName,
			location: req.location,
			tags: {
				...req.tags
			},
			properties: {
				administratorLoginPassword: process.env.DEPLOYMENT_DEFAULT_PASSWORD,
				citusVersion: req.properties.citusVersion,
				coordinatorEnablePublicIpAccess: req.properties.coordinatorEnablePublicIpAccess,
				coordinatorServerEdition: req.properties.coordinatorServerEdition,
				coordinatorStorageQuotaInMb: req.properties.coordinatorStorageQuotaInMb,
				coordinatorVCores: req.properties.coordinatorVCores,
				enableHa: req.properties.enableHa,
				enableShardsOnCoordinator: req.properties.enableShardsOnCoordinator,
				nodeCount: req.properties.nodeCount,
				nodeEnablePublicIpAccess: req.properties.nodeEnablePublicIpAccess,
				nodeServerEdition: req.properties.nodeServerEdition,
				nodeStorageQuotaInMb: req.properties.nodeStorageQuotaInMb,
				nodeVCores: req.properties.nodeVCores,
				postgresqlVersion: req.properties.postgresqlVersion
			}
		}
	]
})

const deployResource = async (
	deploymentName: string,
	client: ResourceManagementClient,
	template: Record<string, unknown>,
	resource_group: string
) => {

	const deployment: Deployment = { properties: { mode: "Incremental", template: template } };
	try {
		const response = await client.deployments.beginCreateOrUpdate(resource_group, deploymentName, deployment);
		return response;
	} catch(error) {
		throw error;
	}
}

const getRedisClient = async (context: Context) => {
	const client = redis.createClient({ url: process.env.REDIS_CONNECTION_STRING });
	client.on('error', err => context.log('Redis client error', err));
	await client.connect();
	return client;
}

export default createCluster;