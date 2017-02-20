'use strict';

var expect = require('chai').expect,
    sinon = require('sinon'),
    assert = require('chai').assert;
var eurekaClient = require('../athena-eureka-client');
var stubbit = require('stubbit');

describe('#eureka Client',function(){

    it('should get ips as an array',function(done){
        var ips = eurekaClient.getAllIps();
        console.log('ips=',ips);
        //empty array
        assert.lengthOf(ips,1);
        //isarray
        assert.isArray(ips);
        done();
    });

    it('should be able to connect to eureka server with config',function(done){
        var temp_port_no = 8008;

        var eurekaClient = stubbit.requireWithStubs('../athena-eureka-client', 'eureka-js-client');
        var stub = stubbit.getStub(eurekaClient, 'eureka-js-client', 'Eureka');

        stub.returns({start: function() {}});

        eurekaClient.connectAllIp(function(confign){
              confign.eureka.host = 'localhost';
              confign.eureka.port = temp_port_no;
              confign.eureka.servicePath = '/eureka/eureka/apps';
              return confign;
           });

        expect(stub.getCall(0).args[0].eureka.port).to.be.equal(temp_port_no);
        expect(stub.getCall(0).args[0].eureka.host).to.be.equal('localhost');
        done();
    });
});