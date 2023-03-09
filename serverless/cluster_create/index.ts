import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { DefaultAzureCredential } from "@azure/identity"
import { Deployment, ResourceManagementClient } from "@azure/arm-resources";
import { DeploymentRequest } from "./request";

const createCluster: AzureFunction = async (context: Context, req: HttpRequest): Promise<void> => {

    const azureSubscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
	const resourceGroup = process.env.DEPLOYMENT_RESOURCE_GROUP;

    const credential = new DefaultAzureCredential();
    const client = new ResourceManagementClient(credential, azureSubscriptionId);
	const deploymentRequest = req.body as DeploymentRequest;
	const template = getDeploymentTemplate(deploymentRequest);

	try {
		const response = await deployResource(deploymentRequest.name, client, template, resourceGroup);
		context.res = { status: 200, body: JSON.stringify(response) };
	} catch(error) {
		context.log(error);
		context.res = { status: 500, body: JSON.stringify(error) };
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

export default createCluster;