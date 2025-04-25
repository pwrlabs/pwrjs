import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import FalconServiceBrowser from '../services/falcon/falcon-browser.service';
import PWRFaconl512Wallet from '../wallet/falcon-512-wallet';
import PWRJS from '../protocol/pwrjs';
import { Falcon } from '../services/falcon.service';
import { hkdfSync } from 'crypto';

// cheerpjInit();
const javaSign = {
    signature:
        '39B1AE57F174A1226D0376B3C8680734FAF680310A85E2136540B36BA7131AE6567563F922737EB3AC1679F0B1FBD2214DF4D029F79BBC42C489199CB779F6CDF04F823F8E58FBB9924EF1BE1192E1EFD165D6FD6991D2C3AB269E05FD51CD5D6F1DC7D4484EF459256FD3D2C43DCC9EDEF3777975AC28CC2489CE44AFB48EC2C0FEAA313287D6D2B926B52E58358C8A2DC1A35B1FCB03ABB782DE824DE059E1F186863EF47AF083FF129C10373126C243B58CA6A5BFAC5B691FA9FA03915528B41C83174CFA439B2BA47926CE412918B5C8C5C05727025CFF6C353B38C494DDC83155C4417CDF27C9B294D6D43156C93EAD0A70384EDE8D3784B45137EE2473D0B8028C99D092083A9B863676047395A288937F32D8EE55A0C7ABAE564FA449AC4B50426EC0AC9E39BE2AE18D620CC5BF8666EFF6BD523D05727973126B588CC2104637912C80C42CB0A256440A948D920BDE7B23C886609F7C743761CAB6A195F5173693E87944CB9F59D4698DCFE1172A6C5AE1138F284B85435969DEBA7C82EDD44A7ADD3D52E42132FB9EDFD3FC46990C2EE7E752E61BCEA641FD65189276A87C108D18C563B1774DE75E3B1F42A9CCEE489ED69B0559876470FC767FB486E650B99D7D2D6573711496A34F7F5933E4B7F04C51FEC9F5EB0C4CC39E531B3BA345BD7BF9BCB305DD25B39664890C7A48FC4B882E7AA788CDCEF6E2939765AAF00936BBAF99C3964923F53A9AB02FF58D5EB6C112B4359DBFF2BDB4341ABF2B16223FDA606EB76DD335299DB5EDAA2AABE9F714D3BA8FB0D1DD76CE165316FA518147BCF67C4D87943090E4D25EDB46E1339A6BCA23AC85C283C86B4892D7388F8E23BDEEEF2F1F26811C466547E3610A3C961DD51D82A763250DD199E174DB5CD6C5F9972C1E3D1AA51EE81C18',
    pubkey: '0F5A054292D35C3EC2F0723ADD189F2C2CCA8D1E23AA3686D5B4D88287344704C2A12D4C1C92A2C1E0D02DA6827A4F6CFF9FB97B03E15FCC4F541FD1B4EAE2B792BEB3E889AA744C5888F9AC8E99D8EDB7B2C664017EA34039A2B36F1E01218A25584DA57AC4C761AE29395523025C446AE8BEC08515131212A328D7C09CA585342B240C1C0BCA19C9169F4F71CC603BF16EC42D5523124B678992363BD9DDC866B39A459B360BD016648468A747505BBCE8E4AED5797E2E614533E397B898AC92A128FC4564D5D1B815ADB7F28A07ABE2450BF4EF8BB457E7A7486E6A92A37A266AB1E04F5CED3D12C295E490D76C3C537BFD6C162A5A82A04E5F705621832A8D5B4823393AF92C1BAB91C5DBEA18CD9C3091E747A9845599EE9D48C307968DC68AE331A0AA966A8506A82AD621693F478F88B460D4EF60608DFC71796BD52A66D04121412B0F02812CF952F574A6D7479247E209EA5FBE299B6287E9E492C90C6BA18BFB0F0535867AD79A685098F950CF5D71686CEA5C198882A027842C93F806B0B645B391C459BE3A941B5EFB5F1C028BDA8B2D8EB9F6C285998A72A5E2E978C143A442184AD4DE56A05917035FDD0E6DF6077B87EFF7719D5CF8D5525B7114C8E1781549069D6618555896AB781BA423D92810F16355B1EFF6A7E98C00DA021782CD677A4A2E364CA807753ED3BAAA7EC968FE07159A0C6E641D00F0440CD5D52AD1D11A62B0ABCB664C8E34F163BCC0A94C048F138ECB559AC97F9AAF478D88640272251610483129A1BE0970A0C253937BC0BA9F1E78FB7FE42E37C2C4916495A376843B43C0AEC83CB28B442CDF9B768CFBB71F2CB90E06E61A5BD7D1A4419FF582AE9EB34E0E8692850E2CC429B955EDE0487E148998A5DB79615C799E43C52A30B5020849914F42561791E23E11D0E0BA9D4A027A9D66F0EBD8E97709BF86F1CDAD4779DF87471BF92D6099802FC56385422462A015E35315F60B91CE4293BC26218D6E6D3A142B42F9AECF7F50F503060A0600B530631160167F903F455A630C8B689695DD9BADBB465A360F8B2377A90595DCCDCD1056C5343E28FD01123F2984A513231026E7BBACB71C34AFA9D36125681D44730C2AE5434639EB6CC70A10BABED9C72E0B90AC885763DD0962A1F0B55AD5BD40902B311CABF645693D82A72DCAB99060733DE451AE99AA24FE19CB1ED973C2005A4BAFBAB20A59C14A1EEAF284AEE18FBD3DD4AA20A515124AA98117EE7E515AE0B539DC11',
    message: 'Hello, World!',
};

const defWallet = {
    pk: '094e0870a62a1445374906e4894f39b844f5d262a286776ab13a609a8c9acc78c3729dea544e6403b107fa668864e48e03b457051b89b6235c1a098cc6f7e4c5a0c9a237ef245c6894cc4730a68b034a0e27975d9f8256aaa8c7a32d1d7593188866b982cde6d241419498dd080a48cef9500c57cad3097cbef4aba2642b3d225a77f1da297c6f2489dab9eab100aa4a26c46f5252e800a0859e7441698a39e219875b8d24729c1a8231ea55249521be8dbe86da66420c4569df654480a63ed0f2661b6276b0412dd00158c99c6ed929e751eb204643abf3acea5c71be9a3f8d252d8ddd783d8d210dd19777780e1346a84d17b629198dc9d065828c88b46c54d79166fa00d6ed8abad8320f14551527c15c0644ffd62269707ad2b964744a1bb42cda454f60765538c80a349e7d5f5945b3d8c17c7e4e6f22c28d566e8d7f71f0e1fd5b995df4a64acba6e2d1e349840d24cc8d29d2091c9a7c8628e4ee1fbf1ee2c5eb05c7b2c46b22c4013f18e0f144629962720c620ac46c9b98aad0cb572172a09adbc8e64ae29fdd49d9e72258691d5c5b076ecf1606d891e688c63d3c9e74caefd18bd14622cbd301326879bb3a4d10943dbe228182c94f2e1b964f833562ea38598b1b1f09642b014269dcbc1607e2562dd24d19df90f88c3803c1ad62af8e9706003df1b744c7864af900cd9d509ab4e1e5776c071911896aa82a4d31b42fb7e221e0170d22bb21e53c1575ed208181250a61958240462e6f29836355d86e379d9328481c656498a1f269e69b30b5e04ad64e65b145e59080e2033b3a4d7a2aa410a806fd8b215ecfa1658dd898e7b533998145cca17d0948e302c562505d31cc601f9766040a32ca82ef1e0dfab384830c6c1ff22567fb0e743d297717faeab2b806e2d84dc10b52c060e2ee8e986dbc4603a9ed4a8b25f5c391acc40cdd6e5bad202f8b0d5aa659c0f8496ccec5e32424643e6170cbabac5f0816d5ad689e4fa5a46a2b644db77543e510d35f65cc7b40b082e960e200c53069d076942e760c47df5e5571208ca5da00a2d7a9b9e6fba15ae5c9fe599224e5d3b33a401a9b12f2e6406dec346ed8e91141dbad56ad9b492f2a7c669978515ab053ad02dbe8cc876418974a68ab9f07bd42d6d6e4a35fa9dc60c74444618e1af35f898f7dc4d5d1f107f4aaa216532c4b5c39167c43632328b812f3881945e27fa262b7f12c8a07a505b78e53c3b4f934dae9685896bad4066e18f95d1842d90fa680',
    sk: '59fc4002fbbebde81004f83141f4413ef810ff0c1ebc0f6e3d08337ffbf17af02001e4303f108ffceffeffdc90821bb08123f108f7fec5fc2e07144fc9006e0423ee7dfffffefc404800703d101ffcf3c045004f8007e143f81f42fc413ef3c0c1141002efee40f030befbe03bf05fbcf7c27debdffefc7fc1182f41f41f811421bff46fbd03ff7e03b1c1f7f0c3f400780c01400f9100140183ec214414013befefbf0fd0c0f4504213a043f78f83fc5ebf081ffd03e0c5041000ec5f43f8213a087ec21fd0820fe045efafc6f430c20bb1bc0fb083fc3088ff408104207e105fc617f083f02ec227eec103e103e05fc017cf8200a07cfff201d41041f3ee41fbee3e0bef3d1faf80ff8f00f7effe0c0086e42f8408018603c041e81f800b604418123defdf3eec10c7081000e48041fc303e0810c0088f83fbfe7ef01f7c0be13dec6f41f060bf100f82ffdffbe010c00460421b90c20ff080fc1084203e45f80f7bebe082100e3ff42ec00bd1c408108023f0051c3f4007af85041183241041048fc3f46ffefff00018810013bf44103279e4507d13f0810feffaec10bd0c4045ff90c30c70fc000e861420fce80fbce81fff0c30fd07f0820fc0bc07d0beffe0451010fb07ff050fd1c207e145fbcefaec0efcfbe2bdffa0cbfbc1041bcf81efcf7ef7bfbff8213f109fc0f7c0fd0001420440462fd03d27d0c2d460c3f05003e3c138f87f800030bfe39e83fbd2821b9ec1fc1dc313eeff1040c803efc00400ff1ff0c4048044f450820bdf45fc2e45145e00ef903cef61470fefbf17ef7cf81075f06002080f81000dc0e7e0040801c4246f390840bcfbf0fd0bc186ebf00203f0f603e03dff9f80efe17e1c22030c317edc417e0440b7041003fbdf400400ba081f040ffdfc0bdffa13b1bd03e2bedbdfc207713a002e0017c1bf1c6142f830c503cf420c30c5f7ffbaf0204107f0ffffb041f020fdffb0bcec7103f45f0008317e0801040421bd03cdc2ffe00a180f42040f8303f03ee48e3a0030c20000400be14cfffe401401be0c4fc5f82f40dbff82f41f3ef010c013f04008107818f6db0612021c171a1b16e00f06d8361a111006d71d1f10d84309f3e9ee1deee80df7e9ec1feee916edfd1821de0aeaf926e1fced2ac3f80737dbfe1bf8dfeeddfa17fef7280cdcf01ad70608e5d505d92c09e4ecfff3f223ede8f90e1000db0b0ae511ee09f00a35c80ef604e5380032140eeaee070200c303ed2e1be13303db251a0d01fbf51f0511e5fb00fe0bc9ebecfd262df1eaf718f325fa03d9020902e2fcdce81bf91905e400f4e81130f7070405ec19ca04fbfff3e60de7fb031821de0227effb0edbe00027e9f013ebd21208f43015170a0403d71af1011b2ed6f90eeb0e181beda6f2f80821fb06f2f026f1f2ea1afcf9dbf819032705fe0bfb0f070703000ed0da14f637f1e6f925e51b16bae1120df4e8eff8130eff1dd5dcf4d904d11f05fffefefbef1e200610d1e8fbfc0e1806f91bdb062e031a2bedc6301510ffdbf01be90c312bf602250200f7fd28e3c5f0281bfc310519f7e3131e20b41df817fbfc12f9070a6a06d3f103cb17fd31f31426fe1624161d1bf40806f3eb0be5160aceff28d922090dcde6eecc1815e1fa23f90311f0fbe0fa2104da11081debe6f6f322140dc4f6e81a06e40bd50e04f034f403eee4f9f8dd09edeb05f5eb23f4ef1125f803f1e103fb140511251c1b182402bb1efae6cce1e320ebe0091fe1012ddbdaed13fae0c728df28f2e301fa0be20a06fcfe14eae8181028',
    address: '0x61a128694eaec0c7ba6abfa9eaa6d6f8504350ea',
};

declare global {
    interface Window {
        _pwr: PWRJS;
        svc: typeof FalconServiceBrowser;
        javaSign: typeof javaSign;
        hexToBytes: typeof hexToBytes;
        PWRFaconl512Wallet: typeof PWRFaconl512Wallet;
        defWallet: typeof defWallet;
        wallet: PWRFaconl512Wallet;
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

    window.javaSign = javaSign;
    window.hexToBytes = hexToBytes;
    window.PWRFaconl512Wallet = PWRFaconl512Wallet;
    window.defWallet = defWallet;

    window.javaSign.pubkey = window.javaSign.pubkey;

    const pwr = new PWRJS('https://pwrrpc.pwrlabs.io');
    window._pwr = pwr;

    const pk = hexToBytes(defWallet.pk);
    const sk = hexToBytes(defWallet.sk);
    window.wallet = PWRFaconl512Wallet.fromKeys(pwr, pk, sk);

    let svc = FalconServiceBrowser;
    svc = interceptMethods(svc);
    window.svc = svc;

    window.dispatchEvent(new Event('initCompleted'));

    const resss = await pwr.getAllEarlyWithdrawPenalties();
}
// init();

async function init2() {
    const mnemonic =
        'cram spoon wrong express rack pudding cabbage until movie juice convince season';
    const salt = 'falcon-seed';
    const info = 'falcon-genkey';

    const encoder = new TextEncoder();

    const seed = hkdfSync(
        'sha256',
        encoder.encode(mnemonic),
        encoder.encode(salt),
        encoder.encode(info),
        48
    );

    const keypair = await Falcon.generateKeypair512(new Uint8Array(seed));

    console.log({
        pk: bytesToHex(keypair.pk),
        sk: bytesToHex(keypair.sk),
        seed: bytesToHex(keypair.genkeySeed),
    });
}

init2();

// .then(async () => {
//     const keypair = await window.svc.generateKeyPair();

//     const message = 'PWR Hello from Loque';
//     const msg = new TextEncoder().encode(message);
//     const signature = await window.svc.sign(msg, keypair.pk, keypair.sk);

//     console.log({
//         message,
//         msgHex: bytesToHex(msg),
//         signature,
//         publicKey: keypair.pk.H,
//     });
// })
// .catch(console.error);
