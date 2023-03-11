import { AzureFunction, Context, HttpRequest } from "@azure/functions"

import * as moment from 'moment';
import * as postgres from 'postgres';
import * as redis from "redis";

import { AlertRequest } from "./alert";
import { DeploymentObject } from "./deployment";
import { alertSchema } from "./validation";

const cpuRebalance: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const validation = alertSchema.validate(req.body);
	if (validation.error) {
		context.res = { status: 400, body: { message: "Invalid request object" } };
		return;
	}

    const redisClient = await getRedisClient(context);
    const alertRequest = req.body as AlertRequest;
    const deploymentName = alertRequest.commonLabels.deploymentName;

    const redisValue = await redisClient.GET(deploymentName);
    if (!redisValue) {
        context.res = { status: 400, body: { message: "Invalid deployment name" } };
        return;
    }

    const currentState = JSON.parse(redisValue) as DeploymentObject;
    if (currentState.rebalancedAt && moment(currentState.rebalancedAt).isSame(moment(), 'day')) {
        context.res = { status: 400, body: { message: "Cluster was already rebalanced today" } };
        return;
    }

    const newState = { ...currentState };
	newState.rebalancedAt = new Date();

    try {
        await redisClient.SET(deploymentName, JSON.stringify(newState));
        const sql = postgres(process.env.PG_CONNECTION_URL);
        sql`
            SELECT rebalance_table_shards(rebalance_strategy:='by_shard_count');
        `;
        context.log("REBALANCER WORKED!");
        context.res = { status: 200, body: { message: "Rebalancer started successfully" } };
    } catch(error) {
        await redisClient.SET(deploymentName, JSON.stringify(currentState));
        context.res = { status: 500, body: { message: "Failed to rebalance shards" } };
    }
};

const getRedisClient = async (context: Context) => {
	const client = redis.createClient({ url: process.env.REDIS_CONNECTION_STRING });
	client.on('error', err => context.log('Redis client error', err));
	await client.connect();
	return client;
};

export default cpuRebalance;