import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { DefaultAzureCredential } from "@azure/identity"
import { ResourceManagementClient } from "@azure/arm-resources";

const httpTrigger: AzureFunction = async (context: Context, req: HttpRequest): Promise<void> => {
    
    const azureSubscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
	const resourceGroup = process.env.DEPLOYMENT_RESOURCE_GROUP;
	const deploymentName = "autoscale-cdbpg-deployment"

    const credential = new DefaultAzureCredential();
    const client = new ResourceManagementClient(credential, azureSubscriptionId);

	try {
		const response = await getResource(deploymentName, resourceGroup, client);
		context.res = { status: 200, body: JSON.stringify(response) };
	} catch(error) {
		context.res = { status: 500, body: JSON.stringify(error) };
	}
};

const getResource = async (
	deploymentName: string,
    resourceGroup: string,
	client: ResourceManagementClient
) => {

	try {
		const deployment = await client.deployments.get(
			resourceGroup,
			deploymentName
		);
		return deployment;
	} catch(error) {
		throw error;
	}
}

export default httpTrigger;