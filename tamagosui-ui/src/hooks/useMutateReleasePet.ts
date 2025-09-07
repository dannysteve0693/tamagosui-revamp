import {
    useCurrentAccount,
    useSuiClient,
    useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { queryKeyOwnedPet } from "./useQueryOwnedPet";
import { MODULE_NAME, PACKAGE_ID } from "@/constants/contract";

const mutateKeyPlayWithPet = ["mutate", "release-pet"];

type UseMutatePlayWithPetParams = {
    petId: string;
};

export function useMutateReleasePet() {
    const currentAccount = useCurrentAccount();
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
    const suiClient = useSuiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: mutateKeyPlayWithPet,
        mutationFn: async ({ petId }: UseMutatePlayWithPetParams) => {
            if (!currentAccount) throw new Error("No connected account");

            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::${MODULE_NAME}::release_pet_to_wild`,
                arguments: [tx.object(petId)],
            });

            const { digest } = await signAndExecute({ transaction: tx });
            const response = await suiClient.waitForTransaction({
                digest,
                options: { showEffects: true },
            });
            if (response?.effects?.status.status === "failure")
                throw new Error(response.effects.status.error);

            return response;
        },
        onSuccess: (response) => {
            toast.success(`Pet is released! Tx: ${response.digest}`);
            queryClient.invalidateQueries({ queryKey: queryKeyOwnedPet() });
        },
        onError: (error) => {
            console.error("Error release the pet:", error);
            toast.error(`Error release the pet: ${error.message}`);
        },
    });
}
