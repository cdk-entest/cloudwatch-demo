#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CloudwatchDemoStack } from "../lib/cloudwatch-demo-stack";
import { LambdaCloudwatchAlarmStack } from "../lib/cloudwatch-lambda-demo";

const app = new cdk.App();

// cloudwatch monitor ec2
new CloudwatchDemoStack(app, "CloudwatchDemoStack", {
  vpcId: "vpc-07cafc6a819930727",
  vpcName: "MyNetworkStack/VpcWithS3Endpoint",
  env: {
    region: "ap-southeast-1",
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});

// cloudwatch monitor lambda
new LambdaCloudwatchAlarmStack(app, "LambdaCloudWatchAlramStack", {
  env: {
    region: "ap-southeast-1",
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});
