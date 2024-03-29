export type ClusterState = {
    name: string;
    clusterName: string;
    location: string;
    tags: Tags;
    properties: Properties;
    autoScaledAt?: Date;
    rebalancedAt?: Date;
    tenantIsolatedAt?: Date;
}

export type Properties = {
    citusVersion: string;
    coordinatorEnablePublicIpAccess: boolean;
    coordinatorServerEdition: string;
    coordinatorStorageQuotaInMb: number;
    coordinatorVCores: number;
    enableHa: boolean;
    enableShardsOnCoordinator: boolean;
    nodeCount: number;
    nodeEnablePublicIpAccess: boolean;
    nodeServerEdition: string;
    nodeStorageQuotaInMb: number;
    nodeVCores: number;
    postgresqlVersion: string;
}

export type Tags = {
    tagName1: string;
    tagName2: string;
}