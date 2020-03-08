// Types for @athena/api-gateway-node-client version 1.1.0

declare module '@athena/api-gateway-node-client' {
  import { EventEmitter } from 'events';
  import { Eureka, EurekaClient } from 'eureka-js-client';

  export interface EurekaConfig extends EurekaClient.EurekaConfig { }

  class AthenaEurekaClient extends EventEmitter {
    /**
     * Registers the eureka client with eureka server
     *
     * @param {number} appPort - The port your app is listening on
     * @param {string} appName - The name of your app
     * @param {string} fileLocation - Location of a eureka config file on your system
     * @param {function} configureEurekaServerCallback - Callback function that allows additional config
     * @returns {void}
     */
    connect(
      appPort: number,
      appName: string,
      fileLocation: string | null,
      configureEurekaServerCallback: (defaultConfig: EurekaClient.EurekaConfig) => EurekaClient.EurekaConfig,
    ): void;

    /**
     * Returns the local IP address of the current eurekaClient
     * @returns: {string[]} - List of IP addresses
     */
    getAllIps(): string[];

    client?: Eureka;
  }


  /**
   * Returns the EurekaClient singleton. This function is 
   * primarily needed for typescript projects, which can't
   * directly import instantiated classes from a package
   * 
   * @returns {EurekaClient} - The eureka client singleton 
   */
  export function getEurekaClient(): AthenaEurekaClient;

}
