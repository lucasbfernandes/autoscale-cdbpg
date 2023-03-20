import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { DefaultAzureCredential } from "@azure/identity"
import { ResourceManagementClient } from "@azure/arm-resources";

import { 
	createOrUpdateCluster, 
	ClusterState, 
	FunctionError, 
	getClusterARMObject, 
	getClusterState, 
	getRedisClient, 
	setClusterState, 
	deleteClusterState,
	validateDeploymentInput,
	getRedisKey,
	closeRedisConnection
} from "../common";

const createCluster: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
	let deploymentName: string;

	const azureSubscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
	const resourceGroup = process.env.DEPLOYMENT_RESOURCE_GROUP;
	const credential = new DefaultAzureCredential();
	const resourceClient = new ResourceManagementClient(credential, azureSubscriptionId);
    const redisClient = await getRedisClient();

    try {
        validateDeploymentInput(req);

		const clusterState = req.body as ClusterState;
        deploymentName = clusterState.name;

        await checkIfDeploymentExists(deploymentName, redisClient);

        await setClusterState(deploymentName, clusterState, redisClient);

		const template = getClusterARMObject(clusterState);
		await createOrUpdateCluster(deploymentName, resourceClient, template, resourceGroup);

        context.res = { status: 200, body: { message: "Cluster creation started successfully" } };
    } catch(error) {
        await deleteClusterState(deploymentName, redisClient);

        if (error instanceof FunctionError) {
            context.log("Error:", error.message);
            context.res = { status: error.code, body: { message: error.message } };
        }
		await closeRedisConnection(redisClient);
    }
};

const checkIfDeploymentExists = async (deploymentName: string, client) => {
	const currentState = await getRedisKey(deploymentName, client);
	if (currentState) {
		throw new FunctionError(400, "Deployment already exists");
	}
}
export default createCluster;