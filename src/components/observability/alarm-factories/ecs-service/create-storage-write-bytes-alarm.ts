import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../constants';
import { EcsServiceConfig, AlarmExtraConfigs } from '../../types';

export default function createAlarm(
    name: string,
    threshold: number,
    configs: EcsServiceConfig,
    extraConfigs: AlarmExtraConfigs
): aws.cloudwatch.MetricAlarm {
    const { clusterName, serviceName } = configs;

    const options: pulumi.ResourceOptions = {};
    if (extraConfigs.parent) {
        options.parent = extraConfigs.parent;
    }

    const storageWriteBytesMetric = new awsx.cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        name: 'StorageWriteBytes',
        label: 'StorageWriteBytes',
        dimensions: { ClusterName: clusterName, ServiceName: serviceName },
        statistic: 'Average',
        period: constants.LONG_PERIOD,
    });

    return storageWriteBytesMetric.createAlarm(
        `${name}-storage-write-bytes`,
        {
            comparisonOperator: 'GreaterThanOrEqualToThreshold',
            threshold,
            evaluationPeriods: constants.DATAPOINTS,
            alarmActions: extraConfigs.snsTopicArns,
            okActions: extraConfigs.snsTopicArns,
        },
        options
    );
}
