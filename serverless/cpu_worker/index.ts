import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { DefaultAzureCredential } from "@azure/identity"
import { Deployment, ResourceManagementClient } from "@azure/arm-resources";

import * as redis from "redis";
import * as moment from "moment";

import { DeploymentObject  } from "./deployment";
import { AlertRequest } from "./alert";
import { alertSchema } from "./validation";

const cpuWorker: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
	const validation = alertSchema.validate(req.body);
	if (validation.error) {
		context.res = { status: 400, body: { message: "Invalid request object" } };
		return;
	}

    const azureSubscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
	const resourceGroup = process.env.DEPLOYMENT_RESOURCE_GROUP;

	const credential = new DefaultAzureCredential();
	const resourceClient = new ResourceManagementClient(credential, azureSubscriptionId);
	const redisClient = await getRedisClient(context);

	const alertRequest = req.body as AlertRequest;
    const deploymentName = alertRequest.commonLabels.deploymentName;

    const redisValue = await redisClient.GET(deploymentName);
    if (!redisValue) {
        context.res = { status: 400, body: { message: "Invalid deployment name" } };
        return;
    }

    const currentState = JSON.parse(redisValue) as DeploymentObject;
    if (currentState.updatedAt && moment(currentState.updatedAt).isSame(moment(), 'day')) {
        context.res = { status: 400, body: { message: "Cluster was already auto-scaled today" } };
        return;
    }

	const newState = { ...currentState };
	newState.properties.nodeCount += 2;
	newState.updatedAt = new Date();
	const template = getUpdateTemplate(newState);

    try {
        await redisClient.SET(deploymentName, JSON.stringify(newState));
		await updateResource(deploymentName, resourceClient, template, resourceGroup);
    } catch(error) {
		await redisClient.SET(deploymentName, JSON.stringify(currentState));
    }
};

const getUpdateTemplate = (req: DeploymentObject) => ({
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

const updateResource = async (
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

export default cpuWorker;