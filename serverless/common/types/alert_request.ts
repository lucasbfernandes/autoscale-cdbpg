export type AlertRequest = {
    commonLabels: CommonLabels;
};

export type CommonLabels = {
    metricType: string;
    deploymentName: string;
    company_id: string;
};