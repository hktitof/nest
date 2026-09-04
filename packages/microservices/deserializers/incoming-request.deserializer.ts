import {
  ConsumerDeserializer,
  IncomingEvent,
  IncomingRequest,
} from '../interfaces/index.js';
import { isUndefined } from '@nestjs/common/internal';

/**
 * @publicApi
 */
export class IncomingRequestDeserializer implements ConsumerDeserializer {
  deserialize(
    value: any,
    options?: Record<string, any>,
  ):
    | IncomingRequest
    | IncomingEvent
    | Promise<IncomingRequest | IncomingEvent> {
    return this.isExternal(value) ? this.mapToSchema(value, options) : value;
  }

  isExternal(value: any): boolean {
    if (!value) {
      return true;
    }
    // IncomingRequest = ReadPacket & PacketId. A native packet either
    // carries a pattern (every Nest client emits one) or routes by
    // channel with both `id` and `data` on the wire. Record builders
    // (Nats/Mqtt/Rmq) may omit data, and custom serializers may skip
    // the pattern key, so anything else is treated as a foreign payload
    // (see nestjs/nest#17669 for the response-side twin).
    const hasPattern = !isUndefined((value as IncomingRequest).pattern);
    const looksLikeRequest =
      !isUndefined((value as IncomingRequest).id) &&
      !isUndefined((value as IncomingRequest).data);
    if (hasPattern || looksLikeRequest) {
      return false;
    }
    return true;
  }

  mapToSchema(
    value: any,
    options?: Record<string, any>,
  ): IncomingRequest | IncomingEvent {
    if (!options) {
      return {
        pattern: undefined,
        data: undefined,
      };
    }
    return {
      pattern: options.channel,
      data: value,
    };
  }
}
