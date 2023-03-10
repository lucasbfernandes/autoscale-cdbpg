import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { DefaultAzureCredential } from "@azure/identity"
import { Deployment, ResourceManagementClient } from "@azure/arm-resources";

import * as redis from 'redis';

import { DeploymentObject  } from "./deployment";

const cpuWorker: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log(JSON.stringify(req.body));
    context.res = { status: 200, body: req.body };

    const azureSubscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
	const resourceGroup = process.env.DEPLOYMENT_RESOURCE_GROUP;

	const credential = new DefaultAzureCredential();
	const resourceClient = new ResourceManagementClient(credential, azureSubscriptionId);
	const redisClient = await getRedisClient(context);
    const deploymentName = "dev-deployment-02";

    const redisValue = await redisClient.GET(deploymentName);
    if (!redisValue) {
        context.res = { status: 400, body: { message: "Invalid deployment name" } };
        return;
    }
    const deployment = JSON.parse(redisValue) as DeploymentObject;

    
};

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

export default cpuWorker;