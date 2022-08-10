import {
  aws_cloudwatch,
  aws_cloudwatch_actions,
  aws_ec2,
  aws_iam,
  Duration,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";

interface CloudwatchDemoProps extends StackProps {
  vpcId: string;
  vpcName: string;
}

export class CloudwatchDemoStack extends Stack {
  constructor(scope: Construct, id: string, props: CloudwatchDemoProps) {
    super(scope, id, props);

    const vpc = aws_ec2.Vpc.fromLookup(this, "ExistedVpc", {
      vpcId: props.vpcId,
      vpcName: props.vpcName,
    });

    const role = new aws_iam.Role(this, "RoleForPubEc2CwDemo", {
      roleName: "RoleForPubEc2CwDemo",
      assumedBy: new aws_iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonSSMManagedInstanceCore"
        ),
      ],
    });

    const sg = new aws_ec2.SecurityGroup(this, "SGOpen22ForPubEc2CwDemo", {
      vpc: vpc,
      description: "security for private ec2",
      allowAllOutbound: true,
    });

    const ec2 = new aws_ec2.Instance(this, "Ec2PubCwDemo", {
      role: role,
      vpc: vpc,
      instanceName: "Ec2PubCwDemo",
      instanceType: aws_ec2.InstanceType.of(
        aws_ec2.InstanceClass.T2,
        aws_ec2.InstanceSize.LARGE
      ),
      machineImage: new aws_ec2.AmazonLinuxImage({
        generation: aws_ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        edition: aws_ec2.AmazonLinuxEdition.STANDARD,
      }),
      securityGroup: sg,
      vpcSubnets: {
        subnetType: aws_ec2.SubnetType.PUBLIC,
      },
    });

    // cloudwatch
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

    // cloudwatch action stop ec2 when idle
    alarm.addAlarmAction(
      new aws_cloudwatch_actions.Ec2Action(
        aws_cloudwatch_actions.Ec2InstanceAction.STOP
      )
    );

    // cloudwatch send sns
  }
}
