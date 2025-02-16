import { ICore, IStore, CoreTypes, Verify } from "@exodus/walletconnect-types";
import EventEmitter from "events";
import { AuthEngineTypes } from "./engine";

import { IAuthEngine } from "../types";
import { JsonRpcError, JsonRpcResult } from "@exodus/walletconnect-jsonrpc-utils";
import { Logger } from "@exodus/walletconnect-logger";

export declare namespace AuthClientTypes {
  type Event = "auth_request" | "auth_response";

  interface AuthRequestEventArgs {
    requester: AuthEngineTypes.PendingRequest["requester"];
    cacaoPayload: AuthEngineTypes.CacaoRequestPayload;
  }

  type AuthResponseEventArgs =
    | { message: string; code: number }
    | JsonRpcResult<AuthEngineTypes.Cacao>
    | JsonRpcError;

  interface BaseEventArgs<T = unknown> {
    id: number;
    topic: string;
    params: T;
    verifyContext?: Verify.Context;
  }

  interface EventArguments {
    auth_request: BaseEventArgs<AuthRequestEventArgs>;
    auth_response: BaseEventArgs<AuthResponseEventArgs>;
  }

  interface Options extends CoreTypes.Options {
    metadata: Metadata;
    core?: ICore;
    projectId: string;
  }

  interface Metadata {
    name: string;
    description: string;
    url: string;
    icons: string[];
    redirect?: {
      native?: string;
      universal?: string;
    };
    verifyUrl?: string;
  }
}

export abstract class IAuthClient {
  public abstract readonly protocol: string;
  public abstract readonly version: number;
  public abstract readonly name: string;

  public abstract core: ICore;
  public abstract metadata: AuthClientTypes.Metadata;
  public abstract projectId: string;
  public abstract authKeys: IStore<string, { responseTopic: string; publicKey: string }>;
  public abstract pairingTopics: IStore<string, { topic: string; pairingTopic: string }>;
  public abstract requests: IStore<
    number,
    { id: number } & (AuthEngineTypes.Cacao | AuthEngineTypes.PendingRequest)
  >;

  public abstract events: EventEmitter;
  public abstract logger: Logger;
  public abstract engine: IAuthEngine;

  constructor(public opts: AuthClientTypes.Options) {}

  // ---------- Public Methods ----------------------------------------------- //

  public abstract request: IAuthEngine["request"];
  public abstract respond: IAuthEngine["respond"];
  public abstract formatMessage: IAuthEngine["formatMessage"];
  public abstract getPendingRequests: IAuthEngine["getPendingRequests"];

  // ---------- Event Handlers ----------------------------------------------- //

  public abstract emit: <E extends AuthClientTypes.Event>(
    event: E,
    args: AuthClientTypes.EventArguments[E],
  ) => boolean;

  public abstract on: <E extends AuthClientTypes.Event>(
    event: E,
    listener: (args: AuthClientTypes.EventArguments[E]) => void,
  ) => EventEmitter;

  public abstract once: <E extends AuthClientTypes.Event>(
    event: E,
    listener: (args: AuthClientTypes.EventArguments[E]) => void,
  ) => EventEmitter;

  public abstract off: <E extends AuthClientTypes.Event>(
    event: E,
    listener: (args: AuthClientTypes.EventArguments[E]) => void,
  ) => EventEmitter;

  public abstract removeListener: <E extends AuthClientTypes.Event>(
    event: E,
    listener: (args: AuthClientTypes.EventArguments[E]) => void,
  ) => EventEmitter;
}
