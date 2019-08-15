#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { LambdaCronStack } from '../lib/lambda-cron';

const app = new cdk.App();
new LambdaCronStack(app, 'LambdaCronStack');
