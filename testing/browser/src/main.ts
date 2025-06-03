// import FalconServiceBrowser from '../../packages/core-browser/src/exports/main';
// import PWRFaconl512Wallet from '../../core-browser/src/wallet/falcon-wallet';
// import FalconServiceBrowser from '../../packages/core-browser/src/services/falcon-browser.service';
// import { FalconService } from '@pwrjs/core-browser/services';
import PWRWallet from '@pwrjs/core/wallets/browser';
// import { FalconService } from '@pwrjs/core/services';
import PWRJS from '@pwrjs/core';
import { bytesToHex, hexToBytes } from '@pwrjs/core/utils';

// import { hkdfSync } from 'crypto';

// import { getKernel } from 'falcon-sign';

import { falconKeypair } from 'rust-falcon';

const defWallet = {
    pk: '0908be67e6ea9e683eb47bc4afdb6584011945dced9e83e9fc12f88c33ba79fd59e229fe0fc841c2bd5cd031bc4866abad281d6a0eca1ba9230f556b2705d3146b4e1b9b1e00af2d35a10af4691f412068a2b4471aa669a915461e243e8c0f8b3ad0476caa8451b3131bb1103df13e67814bb2d780d6d56aa3a6de32bf28cb2d52c2466d5c3a17291bc50519e455ed92674f1a3b3675fafab21bcf666cfba9614e1dbf01088bb6a7af2afeddf0ce828d718e0da9fa6c1e547c15588148055450ff836280028f2808a3e6dd2213821e42f989afa634db052288c7bbb49c133e855b2f2618742c883b2bfab407e14b1e93029c0628d7e4af414568b46bd08ffc8ea916245e60b4273263561c55700bc0599d545ed18d74078691b869cf02b696bb2c257dbbc94a046e12ec36244d972964a7b9d752aa3641d30817c7f8525a0b166ea2969ea2e87782c15c056572c28f4b4fb204738702d83407f42ff889496151be5d2b102ef751ba0bc4e8d08402645e298510178f6d2a10e8c3472b1de6db1ae03fa8f471586f0f652a546cc3d1094373b0f2f93c9ec17d5da181d08a271c419f15c3945ea4dc31a55349479d9a98656ba11a34aad3726d997200b1c2663021e207bd874a2456477e1db9f42855c13489a23314ea9b481a66e4f412529a167fe8d0ed1e2bb500a17fadd0191eb2e5d78ecd1436e33aefad9767f4deda775e5a1589bfd9010a745e62c0d68b064c984ed9f8cc4c8a3345b690f0d8065fd23f31a8c64bb4acc33339963d3a19b272f2184d94defaca34eb443d7c9bf0efa7cc15edfefbdf45ee94647fdb6a9d5e2152735293c167b1be63bb40598935e5e9714240b78b89e3e3064b6ebde0ac64dd94d25aea6ba4206af1afeeab7a61aea25b0ec78befa48844eee8881352387e446e149b8f8ab164e3a17a0dea23c81119e21bd28530ea413b197421081f03e5a8d95f42d0fbec50154af2100bc925d45c4afcd7bb5285bcb0b8f2141ce906e02e82a0db21a0308f90ca27c81ea000710b9d157a2153880babaa8bb2bc2a939f111d547cf1338bc94992aea252d1d9a17268253c5c469f810a7702ca64a8ba3d39abc6308e61c8257a0d15b8ba3eda3be52806897b938cc3bda1482e8887ec1c582ca77bda83fa5f6e11e17d0a3e02421044459ce95d2c4c74316213466a9813ee0d6ea341da332498139b55af82be9f49648da330a01c611cb1a5661d58c56c068e82c8875d4281fd473ceade3d4449445c108c',
    sk: '5903c089102f3de441820bc0b9f7d18418417d07e081f8523edc00b9ec41bc1c2f7f0b907f000102fc1045eb8000f41ffbffe041c84f80e4213adfbf7ad80040082081fbecc31031c3138182fbff3a13ae04f7c0bffc117c245040fc1fbb08007ce8117ff860c71430001070bdf3f043e0113ef8103eebb0801400010450bc1bd07ffc40c6fbdf88e7e0fee81fc0147f49f4503917e03d10313c041205fbe07bfbd1ba106f411050830bf14008b0b7e46f030c1ffe03d1411bdefe080f8403d100041fff143f41f00e8400313dfc1f80f08083e80e81f7cf81042fff0f4eff083f860fc104fbc0fef020c20fbf0803d0fc07a1030420bafc4ffc13a140fbafcaf0213d0fc13f080eb9ebdf421390bff3f244fc6f05f7fffc0fbfbc03d0f6101142e7ffbcf76ebe006fc407affcec2e3ff83ec20c80010830bef7e041f41f3e002f8010313f180140145f3e23e03ff46e8517ef01e002820460c91020bd23efb8088f04e41e84fc3f4707cf87fc0201fc4fbff001bed802c2fc2dbf00203f23e0ff0bcf07f8008507e04704300117df4aec3103f7ce43102fc1dbf0c1fc61bb03df800bdfc2000f3c2030b82fb144144e3ffb907ffff0400fe0450bcfc4f3f00403f101f0100a17e005183f0207ffc2140200f8bf03ec3205f03fc4ffbf4310403ef7dfc003ff43082ebc07f081e7f100fbe138082081f400be0481430fd0c1f4507ffbff01ffc0c017f23e07d084f80fc00ff10313c003fbe202f02e440c0f7f0bf1baf7d0480020c50c0fc3040183f000ff1fe13e1790420422400fc139fb9f83081f0614104107ef3bffe081ebbf7f23f041001fbdfbbec108314604208013ff7bf81fbe041f0a048f87f400fe0430050c21430bb1bc086fbbfc1f7bf85efd03d0bef81f3a082e86f7df840b7fcbe410830c1102f03181efe180fc210208af7b0800400bfe451bbfbe04107f1010820c513b07bf7e13d001f7a0be081fbd08420708204600200207d0fddc0042efef43e42f800020c40fb0fe1ba13b040ff9ec407f07efbb07e13cf44ec21c4fbd048201f8210214510603e3fbffc240ec1076041113e601fee7fe24e8110a03264117f8311a031a0f38e5eb17c70b1c0808f911c607db0d4b05fe14efe8e819e9020d12e8c9f813fed52405f8080ade0dc604f007fff61a1b0321e5fbeef7d12900ed1902f3f809f00d170702f20c26e8fbcc20efdb0adc1048ffdac726ed03061118e716f2f5ddfb02de2510de1015ea1314ed040217df3be91c1817f4dbdf05fb05e8fb09fff01d2a002e0c02fbc60bed0ff41c06fa0ed600f6fc0b27f9f723efe92ce2420b1907000315ccf71f0204141e01f4e30718d7e81515033022fee810eb11c125e6c304db180712100dc4dcffe5f6fa12ebe504fa01e92121d9e7dae902ebf21705fde4ed13d0ecfbf1dffbf200fddc18fbc0e61803d83c230a160ce1f4bf27cc071fe227300204121ffe020317fee60f05061bfeee2534fe1c20f2f7e3f42a110ff11924170d1336ec060bf9170808f5dccc0d20bf13d51113191123eef401edfe1a061909e9facf34cf31103ffae80d0cdffee943f904fed5030519f40feaea1527c7050ffff1cd242d250b1bf10823ef06141622e7eddf28da150b34fb0ecb3bec120de9ef1f18ee3f1c1104ede507eafc32240200f0f8ecf21e0511f80dde160e141f03e8ffe21933cd38140ff70be6002314c9fa01def8f405190734fdec10ec03d13529ff0929ecede738dcefef0cdc05ce18fcddd31de9f4e209ffb2cd07f710e2f029d4dce9f607e007',
    address: '0xe68191b7913e72e6f1759531fbfaa089ff02308a',
};

const testing: {
    message: string;
} = {
    message: 'hello world',
};

declare global {
    interface Window {
        _pwr: PWRJS;
        // svc: typeof FalconService;
        hexToBytes: typeof hexToBytes;
        PWRFaconl512Wallet: typeof PWRWallet;
        defWallet: typeof defWallet;
        wallet: PWRWallet;
        testing: typeof testing;
    }
}

// #region intercept
interface Displayable {
    innerHTML: string;
}

function appendDisplay(content: string): void {
    const div: Displayable = document.createElement('div');
    div.innerHTML = content;
    document.body.appendChild(div as unknown as Node); // Type cast for simplicity
}

function displayMethodCall(methodName: string, args: any[]): void {
    appendDisplay(`${methodName}(${args.join(', ')})`);
}

function displayMethodResult(methodName: string, result: any): void {
    const resultString = typeof result === 'string' ? result : JSON.stringify(result);
    appendDisplay(`${methodName} => ${resultString}`);
}

/**
 * Wraps an object with a proxy that intercepts method calls and logs their arguments and results.
 * If the method returns a promise, the result is logged after the promise resolves or rejects.
 * @param svc The service object whose methods should be intercepted.
 * @returns A proxy that behaves like svc but with added logging.
 */
function interceptMethods<T extends object>(svc: T): T {
    return new Proxy(svc, {
        get(target, prop, receiver) {
            const original = Reflect.get(target, prop, receiver);
            if (typeof original === 'function') {
                return function (...args: any[]) {
                    const methodName = String(prop);
                    displayMethodCall(methodName, args);
                    console.time(methodName);
                    const result = original.apply(target, args);
                    if (result && typeof result.then === 'function') {
                        // Handle promise return values
                        return result
                            .then((resolved: any) => {
                                console.timeEnd(methodName);
                                displayMethodResult(methodName, resolved);
                                return resolved;
                            })
                            .catch((error: any) => {
                                console.timeEnd(methodName);
                                displayMethodResult(methodName, error);
                                return Promise.reject(error);
                            });
                    } else {
                        console.timeEnd(methodName);
                        displayMethodResult(methodName, result);
                        return result;
                    }
                };
            }
            return original;
        },
    });
}

// #endregion

async function init() {
    const a = Promise,
        b = setTimeout;
    await new a((_) => b(_, 1000));

    // window.hexToBytes = hexToBytes;
    // window.PWRFaconl512Wallet = PWRFaconl512Wallet;
    window.defWallet = defWallet;

    window.testing = testing;

    const pwr = new PWRJS('https://pwrrpc.pwrlabs.io');
    window._pwr = pwr;

    const pk = hexToBytes(defWallet.pk);
    const sk = hexToBytes(defWallet.sk);
    window.wallet = PWRWallet.fromKeys(sk, pk, pwr);

    // let svc = FalconService;
    // svc = interceptMethods(svc);
    // window.svc = svc;

    window.dispatchEvent(new Event('initCompleted'));
}
init();
