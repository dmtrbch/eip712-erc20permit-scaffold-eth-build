import { useReducer, useState } from "react";
import { ContractReadMethods } from "./ContractReadMethods";
import { ContractVariables } from "./ContractVariables";
import { ContractWriteMethods } from "./ContractWriteMethods";
import { Abi } from "abitype";
import { ethers } from "ethers";
import { useContractRead, useSignTypedData } from "wagmi";
import { ArrowSmallRightIcon } from "@heroicons/react/24/outline";
import { Spinner } from "~~/components/Spinner";
import { Address, Balance, Signature } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useNetworkColor } from "~~/hooks/scaffold-eth";
import { getTargetNetwork } from "~~/utils/scaffold-eth";
import { ContractName } from "~~/utils/scaffold-eth/contract";

type ContractUIProps = {
  contractName: ContractName;
  accountAddress?: string;
  className?: string;
};

type TSignatureResult = {
  r: string;
  s: string;
  v: number;
};

/**
 * UI component to interface with deployed contracts.
 **/
export const ContractUI = ({ contractName, accountAddress = "", className = "" }: ContractUIProps) => {
  const [refreshDisplayVariables, triggerRefreshDisplayVariables] = useReducer(value => !value, false);
  const configuredNetwork = getTargetNetwork();

  const { data: deployedContractData, isLoading: deployedContractLoading } = useDeployedContractInfo(contractName);
  const networkColor = useNetworkColor();

  const [signature, setSignature] = useState("");
  const [signatureResult, setSignatureResult] = useState<TSignatureResult>();

  const amount = BigInt(10000);
  const deadline = +new Date() + 60 * 60;

  const { data: accountNonceData } = useContractRead({
    address: deployedContractData?.address,
    abi: deployedContractData?.abi as Abi,
    functionName: "nonces",
    args: [accountAddress],
    enabled: contractName === "MyToken" ? true : false,
  });

  // All properties on a domain are optional
  const domain = {
    name: "MyToken",
    version: "1",
    chainId: configuredNetwork.id,
    verifyingContract: deployedContractData?.address,
  } as const;

  // The named list of all type definitions
  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  } as const;

  const message = {
    owner: accountAddress || "",
    spender: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    value: amount,
    nonce: accountNonceData ? (accountNonceData as bigint) : BigInt(0),
    deadline: BigInt(deadline),
  } as const;

  const {
    data: signedData,
    isError,
    isLoading: signedDataLoading,
    isSuccess,
    signTypedData,
  } = useSignTypedData({
    domain,
    message,
    primaryType: "Permit",
    types,
    onSuccess(data) {
      console.log(data);
    },
  });

  const handleSignatureChange = (event: { target: { value: any } } | undefined) => {
    setSignature(event?.target.value);
  };

  const getRSVFromSignature = (signature: string) => {
    const split = ethers.utils.splitSignature(signature);
    setSignatureResult({
      r: split.r,
      s: split.s,
      v: split.v,
    });

    console.log("r: ", split.r);
    console.log("s: ", split.s);
    console.log("v: ", split.v);
  };

  if (deployedContractLoading) {
    return (
      <div className="mt-14">
        <Spinner width="50px" height="50px" />
      </div>
    );
  }

  if (!deployedContractData) {
    return (
      <p className="text-3xl mt-14">
        {`No contract found by the name of "${contractName}" on chain "${configuredNetwork.name}"!`}
      </p>
    );
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-6 px-6 lg:px-10 lg:gap-12 w-full max-w-7xl my-0 ${className}`}>
      <div className="col-span-5 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
        <div className="col-span-1 flex flex-col">
          <div className="bg-base-100 border-base-300 border shadow-md shadow-secondary rounded-3xl px-6 lg:px-8 mb-6 space-y-1 py-4">
            <div className="flex">
              <div className="flex flex-col gap-1">
                <span className="font-bold">{contractName}</span>
                <Address address={deployedContractData.address} />
                <div className="flex gap-1 items-center">
                  <span className="font-bold text-sm">Balance:</span>
                  <Balance address={deployedContractData.address} className="px-0 h-1.5 min-h-[0.375rem]" />
                </div>
              </div>
            </div>
            {configuredNetwork && (
              <p className="my-0 text-sm">
                <span className="font-bold">Network</span>:{" "}
                <span style={{ color: networkColor }}>{configuredNetwork.name}</span>
              </p>
            )}
          </div>
          <div className="bg-base-300 rounded-3xl px-6 lg:px-8 py-4 shadow-lg shadow-base-300">
            <ContractVariables
              refreshDisplayVariables={refreshDisplayVariables}
              deployedContractData={deployedContractData}
            />
          </div>
        </div>
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
          {contractName === "MyToken" && (
            <>
              <div className="z-10">
                <div className="flex flex-col items-center p-5 divide-y divide-base-300">
                  <button
                    className="btn btn-primary rounded-full capitalize font-normal font-white flex items-center gap-1 hover:gap-2 transition-all tracking-widest"
                    onClick={() => signTypedData()}
                    disabled={signedDataLoading}
                  >
                    {signedDataLoading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <>
                        Sign Approval <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
                      </>
                    )}
                  </button>
                  {isSuccess && <Signature signature={signedData} />}
                  {isError && <div>Error signing message</div>}
                </div>
              </div>
              <div className="z-10">
                <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 flex flex-col mt-10 relative">
                  <div className="h-[5rem] bg-base-300 absolute self-start rounded-[22px] -top-[38px] -left-[1px] -z-10 py-[0.65rem] shadow-lg shadow-base-300">
                    <div className="flex items-center justify-center space-x-2">
                      <p className="my-0 px-4 text-sm">Get r, s, v from signature</p>
                    </div>
                  </div>
                  <div className="p-5 divide-y divide-base-300">
                    <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-1">
                      <div className="flex border-2 border-base-300 bg-base-200 rounded-full text-accent">
                        <input
                          className="input input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400 h-[2.2rem] min-h-[2.2rem] px-4 border w-full font-medium placeholder:text-accent/50 text-gray-400"
                          placeholder="string signature"
                          name="signature"
                          autoComplete="off"
                          onChange={handleSignatureChange}
                          value={signature}
                        />
                      </div>
                      <div className="flex justify-between gap-2 flex-wrap">
                        <div className="flex-grow w-4/5">
                          {signatureResult !== null && signatureResult !== undefined && (
                            <div className="bg-secondary rounded-3xl text-sm px-4 py-1.5 break-words">
                              <p className="font-bold m-0 mb-1">Result:</p>
                              <pre className="whitespace-pre-wrap break-words">r: {signatureResult.r}</pre>
                              <pre className="whitespace-pre-wrap break-words">s: {signatureResult.s}</pre>
                              <pre className="whitespace-pre-wrap break-words">v: {signatureResult.v}</pre>
                            </div>
                          )}
                        </div>
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={!signature}
                          onClick={() => getRSVFromSignature(signature)}
                        >
                          Get r, s, v 📡
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          <div className="z-10">
            <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 flex flex-col mt-10 relative">
              <div className="h-[5rem] w-[5.5rem] bg-base-300 absolute self-start rounded-[22px] -top-[38px] -left-[1px] -z-10 py-[0.65rem] shadow-lg shadow-base-300">
                <div className="flex items-center justify-center space-x-2">
                  <p className="my-0 text-sm">Read</p>
                </div>
              </div>
              <div className="p-5 divide-y divide-base-300">
                <ContractReadMethods deployedContractData={deployedContractData} />
              </div>
            </div>
          </div>
          <div className="z-10">
            <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 flex flex-col mt-10 relative">
              <div className="h-[5rem] w-[5.5rem] bg-base-300 absolute self-start rounded-[22px] -top-[38px] -left-[1px] -z-10 py-[0.65rem] shadow-lg shadow-base-300">
                <div className="flex items-center justify-center space-x-2">
                  <p className="my-0 text-sm">Write</p>
                </div>
              </div>
              <div className="p-5 divide-y divide-base-300">
                <ContractWriteMethods
                  deployedContractData={deployedContractData}
                  onChange={triggerRefreshDisplayVariables}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
