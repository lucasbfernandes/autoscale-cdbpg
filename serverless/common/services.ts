import { Deployment, ResourceManagementClient } from "@azure/arm-resources";
import { HttpRequest } from "@azure/functions";
import * as moment from "moment";
import * as redis from "redis";
import { FunctionError } from "./errors/function";

import { ClusterState } from "./types/cluster_state";
import { alertSchema } from "./validations/alert";
import { deploymentSchema } from "./validations/deployment";

export const getRedisClient = async () => {
	const client = redis.createClient({ url: process.env.REDIS_CONNECTION_STRING });
	await client.connect();
	return client;
};

export const checkIfOperationMadeToday = (state: ClusterState, operationKey: string) => {
    return state[operationKey] && moment(state[operationKey]).isSame(moment(), 'day');
};

export const setRedisValue = async (key: string, value: string, client) => {
    await client.SET(key, value);
};

export const deleteRedisKey = async (key: string, client) => {
    await client.DEL(key);
};

export const validateAlertInput = (req: HttpRequest) => {
    const validation = alertSchema.validate(req.body);
	if (validation.error) {
		throw new FunctionError(400, "Invalid request object");
	}
};

export const validateDeploymentInput = (req: HttpRequest) => {
    const validation = deploymentSchema.validate(req.body);
	if (validation.error) {
		throw new FunctionError(400, "Invalid request object");
	}
};

export const validateClusterOperation = (clusterState: ClusterState, operationKey: string) => {
    if (checkIfOperationMadeToday(clusterState, operationKey)) {
        throw new FunctionError(400, "Cannot perform this operation again today");
    }
};

export const setClusterState = async (deploymentName: string, clusterState: ClusterState, client) => {
    await setRedisValue(deploymentName, JSON.stringify(clusterState), client);
};

export const deleteClusterState = async (deploymentName: string, client) => {
    await deleteRedisKey(deploymentName, client);
};

export const getClusterState = async (deploymentName: string, client) => {
    const redisValue = await client.GET(deploymentName);
    if (!redisValue) {
        throw new FunctionError(400, "Invalid deployment name");
    }
    return JSON.parse(redisValue) as ClusterState;
};

export const createOrUpdateCluster = async (
	deploymentName: string,
	client: ResourceManagementClient,
	template: Record<string, unknown>,
	resource_group: string
) => {
	try {
		const deployment: Deployment = { properties: { mode: "Incremental", template: template } };
		await client.deployments.beginCreateOrUpdate(resource_group, deploymentName, deployment);
	} catch(error) {
		throw new FunctionError(500, "Failed to create or update cluster");
	}
}

export const getClusterARMObject = (state: ClusterState) => ({
	$schema: "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
	contentVersion: "1.0.0.0",
	parameters: {},
	resources: [
		{
			type: "Microsoft.DBforPostgreSQL/serverGroupsv2",
			apiVersion: "2022-11-08",
			name: state.clusterName,
			location: state.location,
			tags: {
				...state.tags
			},
			properties: {
				administratorLoginPassword: process.env.DEPLOYMENT_DEFAULT_PASSWORD,
				citusVersion: state.properties.citusVersion,
				coordinatorEnablePublicIpAccess: state.properties.coordinatorEnablePublicIpAccess,
				coordinatorServerEdition: state.properties.coordinatorServerEdition,
				coordinatorStorageQuotaInMb: state.properties.coordinatorStorageQuotaInMb,
				coordinatorVCores: state.properties.coordinatorVCores,
				enableHa: state.properties.enableHa,
				enableShardsOnCoordinator: state.properties.enableShardsOnCoordinator,
				nodeCount: state.properties.nodeCount,
				nodeEnablePublicIpAccess: state.properties.nodeEnablePublicIpAccess,
				nodeServerEdition: state.properties.nodeServerEdition,
				nodeStorageQuotaInMb: state.properties.nodeStorageQuotaInMb,
				nodeVCores: state.properties.nodeVCores,
				postgresqlVersion: state.properties.postgresqlVersion
			}
		}
	]
});