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

const mutateKeyPlayWithPet = ["mutate", "play-and-feed-pet-with-transaction"];

type UseMutatePlayWithPetParams = {
    petId: string;
};

export function useMutatePlayAndFeedPetWithTransaction() {
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
                target: `${PACKAGE_ID}::${MODULE_NAME}::play_with_pet`,
                arguments: [tx.object(petId)],
            });
            tx.moveCall({
                target: `${PACKAGE_ID}::${MODULE_NAME}::feed_pet`,
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
            toast.success(`You feed and play with your pet using transaction block! Tx: ${response.digest}`);
            queryClient.invalidateQueries({ queryKey: queryKeyOwnedPet() });
        },
        onError: (error) => {
            console.error("Error feed and playing with pet using transaction block:", error);
            toast.error(`Error feed and playing with pet using transaction block: ${error.message}`);
        },
    });
}
