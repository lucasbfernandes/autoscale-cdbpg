import { AzureFunction, Context, HttpRequest } from "@azure/functions"

import * as postgres from "postgres";

import {
    AlertRequest, 
    FunctionError, 
    ClusterState, 
    getRedisClient,
    setClusterState,
    validateAlertInput,
    getClusterState,
    validateClusterOperation,
    closeRedisConnection
} from "../common";

const isolateTenant: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    let deploymentName: string;
    let currentState: ClusterState;

    const redisClient = await getRedisClient();
    const pgClient = postgres(process.env.PG_CONNECTION_URL);

    try {
        context.log(JSON.stringify(req.body));
        validateAlertInput(req);

        const alertRequest = req.body as AlertRequest
        const tenantId = alertRequest.commonLabels.company_id;

        deploymentName = alertRequest.commonLabels.deploymentName;
        currentState = await getClusterState(deploymentName, redisClient);
        const operationKey = `tenantIsolatedAt_${tenantId}`;

        context.log(tenantId);

        validateClusterOperation(currentState, operationKey);

        const newState = getNewClusterState(currentState, operationKey);
        await setClusterState(deploymentName, newState, redisClient);

        const response = await triggerTenantIsolation(pgClient, tenantId);
        context.log("Response: ", JSON.stringify(response));
        context.res = { status: 200, body: { message: "Rebalancer started successfully" } };
    } catch(error) {
        await setClusterState(deploymentName, currentState, redisClient);
        context.log("Error: ", error.message);

        if (error instanceof FunctionError) {
            context.res = { status: error.code, body: { message: error.message } };
        }
        await closeRedisConnection(redisClient);
    }
};

const triggerTenantIsolation = async (sql, tenantId: string) => {
    return await sql`
        SELECT isolate_tenant_to_new_shard(
            'public.clicks',
            ${tenantId}::bigint,
            'CASCADE',
            shard_transfer_mode:='block_writes'
        );
    `;
};

const getNewClusterState = (currentState: ClusterState, operationKey: string) => {
    const newState = { ...currentState };
    newState[operationKey] = new Date();
    return newState;
};

export default isolateTenant;