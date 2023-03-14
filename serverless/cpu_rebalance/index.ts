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
    validateClusterOperation
} from "../common";

const cpuRebalance: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    let deploymentName: string;
    let currentState: ClusterState;

    const redisClient = await getRedisClient();

    try {
        validateAlertInput(req);

        deploymentName = (req.body as AlertRequest).commonLabels.deploymentName;
        currentState = await getClusterState(deploymentName, redisClient);

        validateClusterOperation(currentState, "rebalancedAt");

        const newState = getNewClusterState(currentState);
        await setClusterState(deploymentName, newState, redisClient);

        triggerRebalancer();

        context.res = { status: 200, body: { message: "Rebalancer started successfully" } };
    } catch(error) {
        await setClusterState(deploymentName, currentState, redisClient);
        if (error instanceof FunctionError) {
            context.res = { status: error.code, body: { message: error.message } };
        }
    }
};

const triggerRebalancer = () => {
    const sql = postgres(process.env.PG_CONNECTION_URL);
    sql`
        SELECT rebalance_table_shards(rebalance_strategy:='by_shard_count');
    `;
};

const getNewClusterState = (currentState: ClusterState) => {
    const newState = { ...currentState };
    newState.rebalancedAt = new Date();
    return newState;
};

export default cpuRebalance;