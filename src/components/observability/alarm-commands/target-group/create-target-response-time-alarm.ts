import AlarmBuilder from '../../builders/alarm-builder';
import { CreateAlarmCommand } from '../../commands/create-alarm-command';
import AlarmStore from '../../resources/alarm-store';
import { TargetGroupConfig, AlarmExtraConfigs } from '../../types';

export class CreateTargetResponseTimeAlarmCommand extends CreateAlarmCommand {
    constructor(
        readonly name: string,
        readonly threshold: number,
        readonly configs: TargetGroupConfig,
        readonly extraConfigs?: AlarmExtraConfigs
    ) {
        super();
    }

    execute(parent?: AlarmStore) {
        const { loadBalancer, targetGroup } = this.configs;

        const logicalName = `${this.name}-target-response-time`;

        const comparisonOperator = 'GreaterThanOrEqualToThreshold';
        const anomalyDetectionComparisonOperator = 'GreaterThanUpperThreshold';
        const namespace = 'AWS/ApplicationELB';
        const metricName = 'TargetResponseTime';
        const stat = 'Average';
        const dimensions = { LoadBalancer: loadBalancer, TargetGroup: targetGroup };

        const alarmBuilder = new AlarmBuilder()
            .name(logicalName, this.extraConfigs?.suffix)
            .threshold(this.threshold)
            .isShortPeriod()
            .comparisonOperator(comparisonOperator)
            .evaluationPeriods(this.extraConfigs?.evaluationPeriods)
            .dataPointsToAlarm(this.extraConfigs?.datapointsToAlarm)
            .treatMissingData(this.extraConfigs?.treatMissingData)
            .snsTopicArns(this.extraConfigs?.snsTopicArns)
            .setParent(parent)
            .addMetric({
                id: 'm1',
                stat,
                dimensions,
                metricName,
                namespace,
                period: this.extraConfigs?.period,
                returnData: true,
            });

        if (this.threshold === 0) {
            alarmBuilder.hasAnomalyDetection({
                thresholdMetricId: 'e1',
                anomalyComparison: anomalyDetectionComparisonOperator,
                metricToWatchId: 'm1',
                label: metricName,
            });
        }

        return alarmBuilder.build();
    }
}
