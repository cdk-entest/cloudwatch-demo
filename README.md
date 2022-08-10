---
title: CloudWatch Demos
description: Simple monitor and turn off idle ec2, monitor lambda spike load and notification
author: haimtran
publishedDate: 06/23/2022
date: 2022-07-24
---

## Introduction

Simple demos cloudwatch

- Monitor and stop an idle ec2 to save cost
- Monitor spike lambda concurrency and send notification
- Add some custom dashboard/widgetes using CDK
- [GitHub](https://github.com/entest-hai/cloudwatch-demo)

## CloudWath Monitor Lambda

lambda function

```tsx
const fn = new aws_lambda.Function(this, "LambdaCloudWatchAlarmDemo", {
  runtime: aws_lambda.Runtime.PYTHON_3_8,
  handler: "index.handler",
  timeout: Duration.seconds(90),
  code: aws_lambda.Code.fromAsset(path.join(__dirname, "lambda")),
});
```

cloudwatch alarm

```tsx
const alarm = new aws_cloudwatch.Alarm(this, "LambdaInvocationAlarmDemo", {
  metric: fn.metricInvocations({
    statistic: "sum",
    period: Duration.minutes(5),
  }),
  threshold: 5,
  evaluationPeriods: 1,
});
```

cloudwatch action

```tsx
alarm.addAlarmAction(
  new aws_cloudwatch_actions.SnsAction(
    aws_sns.Topic.fromTopicArn(
      this,
      "CodePipelineNotification",
      "arn:aws:sns:ap-southeast-1:392194582387:MonitorEc2"
    )
  )
);
```

dashboard

```tsx
// dashboard for the lambda
const dashboard = new aws_cloudwatch.Dashboard(this, "dashboardDemo", {
  dashboardName: "dashboardLambdaDemo",
});

// create title for dashboard
dashboard.addWidgets(
  new aws_cloudwatch.TextWidget({
    markdown: `# Dashboard: ${fn.functionName}`,
    height: 1,
    width: 24,
  })
);

// add dashboard widgets
dashboard.addWidgets(
  new aws_cloudwatch.GraphWidget({
    title: "Invocation",
    left: [
      fn.metricInvocations({
        statistic: "sum",
        period: Duration.minutes(1),
      }),
    ],
    width: 24,
  })
);

// add dashboard widgets
dashboard.addWidgets(
  new aws_cloudwatch.GraphWidget({
    title: "Duration",
    left: [fn.metricDuration()],
    width: 24,
  })
);
```

## CloudWatch Monitor EC2

cloudwatch alarm on ec2 cpu usage - idel - stop

```tsx
const alarm = new aws_cloudwatch.Alarm(this, "CwDemoMonitorPubEc2", {
  alarmName: "MonitorPubEc2CwDemo",
  comparisonOperator: aws_cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
  threshold: 0.99,
  evaluationPeriods: 6,
  datapointsToAlarm: 5,
  metric: new aws_cloudwatch.Metric({
    namespace: "AWS/EC2",
    metricName: "CPUUtilization",
    statistic: "Average",
    period: Duration.minutes(5),
    dimensionsMap: {
      InstanceId: ec2.instanceId,
    },
  }),
});
```

action stop the instance

```tsx
alarm.addAlarmAction(
  new aws_cloudwatch_actions.Ec2Action(
    aws_cloudwatch_actions.Ec2InstanceAction.STOP
  )
);
```
