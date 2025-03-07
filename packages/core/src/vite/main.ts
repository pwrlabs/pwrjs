import FalconServiceBrowser from '../services/falcon/falcon-browser.service';

// cheerpjInit();
const javaSign = {
    signature:
        '39B1AE57F174A1226D0376B3C8680734FAF680310A85E2136540B36BA7131AE6567563F922737EB3AC1679F0B1FBD2214DF4D029F79BBC42C489199CB779F6CDF04F823F8E58FBB9924EF1BE1192E1EFD165D6FD6991D2C3AB269E05FD51CD5D6F1DC7D4484EF459256FD3D2C43DCC9EDEF3777975AC28CC2489CE44AFB48EC2C0FEAA313287D6D2B926B52E58358C8A2DC1A35B1FCB03ABB782DE824DE059E1F186863EF47AF083FF129C10373126C243B58CA6A5BFAC5B691FA9FA03915528B41C83174CFA439B2BA47926CE412918B5C8C5C05727025CFF6C353B38C494DDC83155C4417CDF27C9B294D6D43156C93EAD0A70384EDE8D3784B45137EE2473D0B8028C99D092083A9B863676047395A288937F32D8EE55A0C7ABAE564FA449AC4B50426EC0AC9E39BE2AE18D620CC5BF8666EFF6BD523D05727973126B588CC2104637912C80C42CB0A256440A948D920BDE7B23C886609F7C743761CAB6A195F5173693E87944CB9F59D4698DCFE1172A6C5AE1138F284B85435969DEBA7C82EDD44A7ADD3D52E42132FB9EDFD3FC46990C2EE7E752E61BCEA641FD65189276A87C108D18C563B1774DE75E3B1F42A9CCEE489ED69B0559876470FC767FB486E650B99D7D2D6573711496A34F7F5933E4B7F04C51FEC9F5EB0C4CC39E531B3BA345BD7BF9BCB305DD25B39664890C7A48FC4B882E7AA788CDCEF6E2939765AAF00936BBAF99C3964923F53A9AB02FF58D5EB6C112B4359DBFF2BDB4341ABF2B16223FDA606EB76DD335299DB5EDAA2AABE9F714D3BA8FB0D1DD76CE165316FA518147BCF67C4D87943090E4D25EDB46E1339A6BCA23AC85C283C86B4892D7388F8E23BDEEEF2F1F26811C466547E3610A3C961DD51D82A763250DD199E174DB5CD6C5F9972C1E3D1AA51EE81C18',
    pubkey: '0F5A054292D35C3EC2F0723ADD189F2C2CCA8D1E23AA3686D5B4D88287344704C2A12D4C1C92A2C1E0D02DA6827A4F6CFF9FB97B03E15FCC4F541FD1B4EAE2B792BEB3E889AA744C5888F9AC8E99D8EDB7B2C664017EA34039A2B36F1E01218A25584DA57AC4C761AE29395523025C446AE8BEC08515131212A328D7C09CA585342B240C1C0BCA19C9169F4F71CC603BF16EC42D5523124B678992363BD9DDC866B39A459B360BD016648468A747505BBCE8E4AED5797E2E614533E397B898AC92A128FC4564D5D1B815ADB7F28A07ABE2450BF4EF8BB457E7A7486E6A92A37A266AB1E04F5CED3D12C295E490D76C3C537BFD6C162A5A82A04E5F705621832A8D5B4823393AF92C1BAB91C5DBEA18CD9C3091E747A9845599EE9D48C307968DC68AE331A0AA966A8506A82AD621693F478F88B460D4EF60608DFC71796BD52A66D04121412B0F02812CF952F574A6D7479247E209EA5FBE299B6287E9E492C90C6BA18BFB0F0535867AD79A685098F950CF5D71686CEA5C198882A027842C93F806B0B645B391C459BE3A941B5EFB5F1C028BDA8B2D8EB9F6C285998A72A5E2E978C143A442184AD4DE56A05917035FDD0E6DF6077B87EFF7719D5CF8D5525B7114C8E1781549069D6618555896AB781BA423D92810F16355B1EFF6A7E98C00DA021782CD677A4A2E364CA807753ED3BAAA7EC968FE07159A0C6E641D00F0440CD5D52AD1D11A62B0ABCB664C8E34F163BCC0A94C048F138ECB559AC97F9AAF478D88640272251610483129A1BE0970A0C253937BC0BA9F1E78FB7FE42E37C2C4916495A376843B43C0AEC83CB28B442CDF9B768CFBB71F2CB90E06E61A5BD7D1A4419FF582AE9EB34E0E8692850E2CC429B955EDE0487E148998A5DB79615C799E43C52A30B5020849914F42561791E23E11D0E0BA9D4A027A9D66F0EBD8E97709BF86F1CDAD4779DF87471BF92D6099802FC56385422462A015E35315F60B91CE4293BC26218D6E6D3A142B42F9AECF7F50F503060A0600B530631160167F903F455A630C8B689695DD9BADBB465A360F8B2377A90595DCCDCD1056C5343E28FD01123F2984A513231026E7BBACB71C34AFA9D36125681D44730C2AE5434639EB6CC70A10BABED9C72E0B90AC885763DD0962A1F0B55AD5BD40902B311CABF645693D82A72DCAB99060733DE451AE99AA24FE19CB1ED973C2005A4BAFBAB20A59C14A1EEAF284AEE18FBD3DD4AA20A515124AA98117EE7E515AE0B539DC11',
    message: 'Hello, World!',
};

declare global {
    interface Window {
        cheerpjInit: any;
        cheerpjRunLibrary: any;
        svc: FalconServiceBrowser;
        javaSign: typeof javaSign;
    }
}

window.javaSign = javaSign;

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
    const resultString =
        typeof result === 'string' ? result : JSON.stringify(result);
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
    console.time('init');
    const cheerpjInit = window.cheerpjInit;
    await cheerpjInit();
    console.timeEnd('init');

    const cheerpjRunLibrary = window.cheerpjRunLibrary;

    console.time('load jar');
    const lib = await cheerpjRunLibrary('/app/falcon.jar');
    const Main = await lib.org.example.Main;
    console.timeEnd('load jar');

    console.time('create service');
    let svc = new FalconServiceBrowser(Main);
    svc = interceptMethods(svc);
    window.svc = svc;
    console.timeEnd('create service');

    window.dispatchEvent(new Event('initCompleted'));
}
init();
// .then(() => {
//     window.svc.generateKeyPair();
// })
// .catch(console.error);
