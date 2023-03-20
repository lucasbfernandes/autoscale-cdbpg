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

const cpuRebalance: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    let deploymentName: string;
    let currentState: ClusterState;

    const redisClient = await getRedisClient();
    const pgClient = postgres(process.env.PG_CONNECTION_URL);

    try {
        context.log(JSON.stringify(req.body));
        validateAlertInput(req);

        deploymentName = (req.body as AlertRequest).commonLabels.deploymentName;
        currentState = await getClusterState(deploymentName, redisClient);

        validateClusterOperation(currentState, "rebalancedAt");

        const newState = getNewClusterState(currentState);
        await setClusterState(deploymentName, newState, redisClient);

        await triggerRebalancer(pgClient);

        context.res = { status: 200, body: { message: "Rebalancer started successfully" } };
    } catch(error) {
        await setClusterState(deploymentName, currentState, redisClient);

        if (error instanceof FunctionError) {
            context.log("Error:", error.message);
            context.res = { status: error.code, body: { message: error.message } };
        }
        await closeRedisConnection(redisClient);
    }
};

const triggerRebalancer = async (sql) => {
    await sql`
        SELECT citus_rebalance_start(rebalance_strategy:='by_shard_count', shard_transfer_mode:='block_writes');
    `;
};

const getNewClusterState = (currentState: ClusterState) => {
    const newState = { ...currentState };
    newState.rebalancedAt = new Date();
    return newState;
};

export default cpuRebalance;