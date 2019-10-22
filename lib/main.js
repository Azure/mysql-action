"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const path = __importStar(require("path"));
const AuthorizerFactory_1 = require("azure-actions-webclient/AuthorizerFactory");
const AzureMySqlActionHelper_1 = __importDefault(require("./AzureMySqlActionHelper"));
const AzureMySqlAction_1 = __importDefault(require("./AzureMySqlAction"));
const FirewallManager_1 = __importDefault(require("./FirewallManager"));
const AzureMySqlResourceManager_1 = __importDefault(require("./AzureMySqlResourceManager"));
const MySqlConnectionStringBuilder_1 = __importDefault(require("./MySqlConnectionStringBuilder"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let firewallManager;
        try {
            let inputs = getInputs();
            let azureMySqlAction = new AzureMySqlAction_1.default(inputs);
            let azureResourceAuthorizer = yield AuthorizerFactory_1.AuthorizerFactory.getAuthorizer();
            let azureMySqlResourceManager = yield AzureMySqlResourceManager_1.default.getResourceManager(inputs.serverName, azureResourceAuthorizer);
            firewallManager = new FirewallManager_1.default(azureMySqlResourceManager);
            yield firewallManager.addFirewallRule(inputs.serverName, inputs.connectionString);
            yield azureMySqlAction.execute();
        }
        catch (error) {
            core.setFailed(error.message);
        }
        finally {
            if (firewallManager) {
                yield firewallManager.removeFirewallRule();
            }
        }
    });
}
exports.run = run;
function getInputs() {
    let serverName = core.getInput('server-name', { required: true });
    let connectionString = core.getInput('connection-string', { required: true });
    let connectionStringBuilder = new MySqlConnectionStringBuilder_1.default(connectionString);
    let sqlFile = AzureMySqlActionHelper_1.default.resolveFilePath(core.getInput('sql-file', { required: true }));
    if (path.extname(sqlFile).toLowerCase() !== '.sql') {
        throw new Error(`Invalid sql file path provided as input ${sqlFile}`);
    }
    let additionalArguments = core.getInput('arguments');
    return {
        serverName: serverName,
        connectionString: connectionStringBuilder,
        sqlFile: sqlFile,
        additionalArguments: additionalArguments
    };
}
run();