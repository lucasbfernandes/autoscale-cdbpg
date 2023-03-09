import * as Joi from "joi";

export const deploymentSchema = Joi.object({
    name: Joi.string().required(),
    clusterName: Joi.string().required(),
    location: Joi.string().required(),
    tags: Joi.object(),
    properties: Joi.object({
        citusVersion: Joi.string().required(),
        coordinatorEnablePublicIpAccess: Joi.boolean().required(),
        coordinatorServerEdition: Joi.string().required(),
        coordinatorStorageQuotaInMb: Joi.number().integer().required(),
        coordinatorVCores: Joi.number().integer().required(),
        enableHa: Joi.boolean().required(),
        enableShardsOnCoordinator: Joi.boolean().required(),
        nodeCount: Joi.number().integer().required(),
        nodeEnablePublicIpAccess: Joi.boolean().required(),
        nodeServerEdition: Joi.string().required(),
        nodeStorageQuotaInMb: Joi.number().integer().required(),
        nodeVCores: Joi.number().integer().required(),
        postgresqlVersion: Joi.string().required()
    }).required()
});
