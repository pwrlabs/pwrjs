import axios from 'axios';

const url = 'https://pwrrpc.pwrlabs.io';

type Delegator = {
    [address: string]: string;
};

export default class Validator {
    private address: string;
    private ip: string;
    private badActor: boolean;
    private votingPower: string;
    private shares: string;
    private delegatorCount: number;

    setAddress(address: string) {
        this.address = address;
    }

    // *~~*~~*~~ getters ~~*~~*~~* //

    getAddress(): string {
        return this.address;
    }

    getIp(): string {
        return this.ip;
    }

    getBadActor(): boolean {
        return this.badActor;
    }

    getVotingPower(): string {
        return this.votingPower;
    }

    getShares(): string {
        return this.shares;
    }

    getDelegatorCount(): number {
        return this.delegatorCount;
    }

    // *~~*~~*~~ others ~~*~~*~~* //
    async getDelegators(): Promise<any> {
        const res = await axios({
            method: 'get',
            url: `${url}/validator/delegatorsOfValidator/?validatorAddress=${this.address}`,
        });

        return res.data.delegators;
    }
}
