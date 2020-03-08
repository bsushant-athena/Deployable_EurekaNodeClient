#!/usr/bin/env groovy

node() {
    def pipeline;
    def testRunner;

    stage('Prepare pipeline') {
        pipeline = new cicd.Pipeline();
        testRunner = pipeline.getTestRunnerInstance([ 'language': 'node' ]);
        pipeline.cleanupAndCheckout();
    }

    stage('npm-kit validate') {
        testRunner.runStaticAnalysis();
    }

    stage('npm test') {
        testRunner.runUnitTests();
    }

    stage('coverage') {
        testRunner.runCoverage();
    }

    stage('Publish') {
        def utils = new cicd.NodeUtil();
        utils.publishPackage();
    }
}