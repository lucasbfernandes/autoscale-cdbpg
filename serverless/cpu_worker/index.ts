import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { DefaultAzureCredential } from "@azure/identity"
import { ResourceManagementClient } from "@azure/arm-resources";

import { 
	createOrUpdateCluster, 
	AlertRequest, 
	ClusterState, 
	FunctionError, 
	getClusterARMObject, 
	getClusterState, 
	getRedisClient, 
	setClusterState, 
	validateAlertInput, 
	validateClusterOperation
} from "../common";

const cpuWorker: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
	let deploymentName: string;
    let currentState: ClusterState;

	const azureSubscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
	const resourceGroup = process.env.DEPLOYMENT_RESOURCE_GROUP;
	const credential = new DefaultAzureCredential();
	const resourceClient = new ResourceManagementClient(credential, azureSubscriptionId);
    const redisClient = await getRedisClient();

    try {
        validateAlertInput(req);

        deploymentName = (req.body as AlertRequest).commonLabels.deploymentName;
        currentState = await getClusterState(deploymentName, redisClient);

        validateClusterOperation(currentState, "autoScaledAt");

        const newState = getNewClusterState(currentState);
        await setClusterState(deploymentName, newState, redisClient);

		const template = getClusterARMObject(newState);
		await createOrUpdateCluster(deploymentName, resourceClient, template, resourceGroup);

        context.res = { status: 200, body: { message: "Auto-scaling started successfully" } };
    } catch(error) {
        await setClusterState(deploymentName, currentState, redisClient);
        if (error instanceof FunctionError) {
            context.res = { status: error.code, body: { message: error.message } };
        }
    }
};

const getNewClusterState = (currentState: ClusterState) => {
    const newState = { ...currentState };
	newState.properties.nodeCount += 2;
    newState.autoScaledAt = new Date();
    return newState;
};

export default cpuWorker;