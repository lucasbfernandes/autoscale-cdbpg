import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { DefaultAzureCredential } from "@azure/identity"
import { Deployment, ResourceManagementClient } from "@azure/arm-resources";

const creationTemplate = {
	$schema: "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
	contentVersion: "1.0.0.0",
	parameters: {},
	resources: [
		{
			type: "Microsoft.DBforPostgreSQL/serverGroupsv2",
			apiVersion: "2022-11-08",
			name: "autoscale-cdbpg-cluster",
			location: "eastus",
			tags: {
				tagName1: "tagValue1"
			},
			properties: {
				administratorLoginPassword: "123test!",
				citusVersion: "11.2",
				coordinatorEnablePublicIpAccess: true,
				coordinatorServerEdition: "GeneralPurpose",
				coordinatorStorageQuotaInMb: 524288,
				coordinatorVCores: 32,
				enableHa: false,
				enableShardsOnCoordinator: true,
				nodeCount: 2,
				nodeEnablePublicIpAccess: true,
				nodeServerEdition: "GeneralPurpose",
				nodeStorageQuotaInMb: 524288,
				nodeVCores: 32,
				postgresqlVersion: "15"
			}
		}
	]
}

const httpTrigger: AzureFunction = async (context: Context, req: HttpRequest): Promise<void> => {
    
    const azureSubscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
	const resourceGroup = process.env.DEPLOYMENT_RESOURCE_GROUP;
	const deploymentName = "autoscale-cdbpg-deployment"

    const credential = new DefaultAzureCredential();
    const client = new ResourceManagementClient(credential, azureSubscriptionId);

	try {
		const response = await deployResource(deploymentName, client, creationTemplate, resourceGroup);
		context.res = { status: 200, body: JSON.stringify(response) };
	} catch(error) {
		context.res = { status: 500, body: JSON.stringify(error) };
	}
};

const deployResource = async (
	deploymentName: string,
	client: ResourceManagementClient,
	template: Record<string, unknown>,
	resource_group: string
) => {

	const deployment: Deployment = {
		properties: {
			mode: "Incremental",
			template: template
		}
	};

	try {
		const response = await client.deployments.beginCreateOrUpdate(
			resource_group,
			deploymentName,
			deployment
		);
		return response;
	} catch(error) {
		throw error;
	}
}

export default httpTrigger;