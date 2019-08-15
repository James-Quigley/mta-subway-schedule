#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { AstoriaTrainsStack } from '../lib/astoria-trains-alexa-skill';

const app = new cdk.App();
new AstoriaTrainsStack(app, 'AstoriaTrainsStack');
