"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Failure = void 0;
const assert = require("assert");
class Failure {
    constructor(host, db, coll) {
        this.host = host;
        this.db = db;
        this.coll = coll;
    }
    async fail(doc, err) {
        let modifiedCount;
        const session = this.host.startSession();
        try {
            session.startTransaction();
            const res = {
                jsonrpc: '2.0',
                id: doc.request.id,
                error: {
                    code: 0,
                    message: err.message,
                    data: {
                        name: err.name,
                        stack: err.stack,
                    },
                },
            };
            ({ modifiedCount } = await this.coll.updateOne({
                _id: doc._id,
                state: 1 /* ADOPTED */,
            }, {
                $set: {
                    'state': 4 /* FAILED */,
                    'failTime': Date.now(),
                    'response': res,
                }
            }, { session }));
            await session.commitTransaction();
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            await session.endSession();
        }
        assert(modifiedCount === 1, new AdoptedTaskNotFound());
    }
}
exports.Failure = Failure;
(function (Failure) {
    class AdoptedTaskNotFound extends Error {
    }
    Failure.AdoptedTaskNotFound = AdoptedTaskNotFound;
})(Failure = exports.Failure || (exports.Failure = {}));
var AdoptedTaskNotFound = Failure.AdoptedTaskNotFound;
//# sourceMappingURL=failure.js.map