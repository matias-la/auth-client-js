import { hashMessage } from "@exodus/ethersproject-hash";
import { recoverAddress } from "@exodus/ethersproject-transactions";
import fetch from "isomorphic-unfetch";

import { AuthEngineTypes } from "../types";
import { DEFAULT_RPC_URL } from "../constants/defaults";

export async function verifySignature(
  address: string,
  reconstructedMessage: string,
  cacaoSignature: AuthEngineTypes.CacaoSignature,
  chainId: string,
  projectId: string,
): Promise<boolean> {
  // Determine if this signature is from an EOA or a contract.
  switch (cacaoSignature.t) {
    case "eip191":
      return isValidEip191Signature(address, reconstructedMessage, cacaoSignature.s);
    case "eip1271":
      return await isValidEip1271Signature(
        address,
        reconstructedMessage,
        cacaoSignature.s,
        chainId,
        projectId,
      );
    default:
      throw new Error(
        `verifySignature failed: Attempted to verify CacaoSignature with unknown type: ${cacaoSignature.t}`,
      );
  }
}

function isValidEip191Signature(address: string, message: string, signature: string): boolean {
  const recoveredAddress = recoverAddress(hashMessage(message), signature);
  return recoveredAddress.toLowerCase() === address.toLowerCase();
}

async function isValidEip1271Signature(
  address: string,
  reconstructedMessage: string,
  signature: string,
  chainId: string,
  projectId: string,
) {
  try {
    const eip1271MagicValue = "0x1626ba7e";
    const dynamicTypeOffset = "0000000000000000000000000000000000000000000000000000000000000040";
    const dynamicTypeLength = "0000000000000000000000000000000000000000000000000000000000000041";
    const nonPrefixedSignature = signature.substring(2);
    const nonPrefixedHashedMessage = hashMessage(reconstructedMessage).substring(2);

    const data =
      eip1271MagicValue +
      nonPrefixedHashedMessage +
      dynamicTypeOffset +
      dynamicTypeLength +
      nonPrefixedSignature;

    const response = await fetch(`${DEFAULT_RPC_URL}/?chainId=${chainId}&projectId=${projectId}`, {
      method: "POST",
      body: JSON.stringify({
        id: generateJsonRpcId(),
        jsonrpc: "2.0",
        method: "eth_call",
        params: [{ to: address, data }, "latest"],
      }),
    });
    const { result } = await response.json();

    if (!result) return false;

    // Remove right-padded zeros from result to get only the concrete recovered value.
    const recoveredValue = result.slice(0, eip1271MagicValue.length);
    return recoveredValue.toLowerCase() === eip1271MagicValue.toLowerCase();
  } catch (error: any) {
    console.error("isValidEip1271Signature: ", error);
    return false;
  }
}

function generateJsonRpcId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}
