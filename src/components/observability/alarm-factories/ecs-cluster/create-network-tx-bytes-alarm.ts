import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';

import * as constants from '../../constants';
import { EcsClusterConfig, AlarmExtraConfigs } from '../../types';

export default function createAlarm(
    name: string,
    threshold: number,
    configs: EcsClusterConfig,
    extraConfigs?: AlarmExtraConfigs
): aws.cloudwatch.MetricAlarm {
    const { clusterName } = configs;

    const period = extraConfigs?.period || constants.LONG_PERIOD;

    const evaluationPeriods = extraConfigs?.evaluationPeriods || constants.DATAPOINTS;
    const datapointsToAlarm =
        extraConfigs?.datapointsToAlarm || extraConfigs?.evaluationPeriods || constants.DATAPOINTS;
    const treatMissingData = extraConfigs?.treatMissingData || constants.TREAT_MISSING_DATA;

    const options: pulumi.ResourceOptions = {};
    if (extraConfigs?.parent) {
        options.parent = extraConfigs?.parent;
    }

    const networkTxBytesMetric = new awsx.cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        name: 'NetworkTxBytes',
        label: 'NetworkTxBytes',
        dimensions: { ClusterName: clusterName },
        statistic: 'Average',
        period,
    });

    return networkTxBytesMetric.createAlarm(
        `${name}-network-tx-bytes`,
        {
            comparisonOperator: 'GreaterThanOrEqualToThreshold',
            threshold,
            evaluationPeriods,
            datapointsToAlarm,
            treatMissingData,
            alarmActions: extraConfigs?.snsTopicArns,
            okActions: extraConfigs?.snsTopicArns,
        },
        options
    );
}