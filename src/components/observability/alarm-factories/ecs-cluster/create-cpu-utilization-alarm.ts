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

    const cpuUtilization = new awsx.cloudwatch.Metric({
        namespace: 'AWS/ECS',
        name: 'CPUUtilization',
        label: 'CPUUtilization',
        dimensions: { ClusterName: clusterName },
        statistic: 'Average',
        period,
    });

    return cpuUtilization.createAlarm(
        `${name}-cpu-utilization`,
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