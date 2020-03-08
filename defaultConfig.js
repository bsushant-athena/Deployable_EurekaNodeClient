// Default configuration values:
export default {
  requestMiddleware: (request, done) => done(request),
  eureka: {
    heartbeatInterval: 30000,
    registryFetchInterval: 30000,
    servicePath: '/public/eureka/apps/',
  },
  instance: {},
};
