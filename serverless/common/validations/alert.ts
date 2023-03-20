import * as Joi from "joi";

export const alertSchema = Joi.object({
    receiver: Joi.any(),
    status: Joi.any(),
    alerts: Joi.any(),
    groupLabels: Joi.any(),

    commonLabels: Joi.object({
        ServerName: Joi.string(),
        alertname: Joi.string(),
        metricType: Joi.string().required(),
        deploymentName: Joi.string().required(),
        grafana_folder: Joi.string(),
        shard_id: Joi.string(),
        company_id: Joi.string()
    }).required(),

    commonAnnotations: Joi.any(),
    externalURL: Joi.any(),
    version: Joi.any(),
    groupKey: Joi.any(),
    truncatedAlerts: Joi.any(),
    orgId: Joi.any(),
    title: Joi.any(),
    state: Joi.any(),
    message: Joi.any()
});
