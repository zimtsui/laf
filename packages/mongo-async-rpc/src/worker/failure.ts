import assert = require("assert");
import { Collection, Db, MongoClient } from "mongodb";
import { Document } from "../document";
import * as JsonRpc from '@lafjs/node-json-rpc';


export class Failure {
	public constructor(
		private readonly host: MongoClient,
		private readonly db: Db,
		private readonly coll: Collection<Document>,
	) { }

	/**
	 *  @throws {@link Failure.AdoptedTaskNotFound}
	 */
	public async fail<
		methodName extends string,
		params extends readonly unknown[],
	>(
		doc: Document.Adopted<methodName, params>,
		err: Error,
	) {
		let modifiedCount: number;

		const session = this.host.startSession();
		try {
			session.startTransaction();

			const res: JsonRpc.Res.Fail = {
				jsonrpc: '2.0',
				id: doc.request.id,
				error: {
					code: 0,
					message: err.message,
					data: {
						name: err.name,
						stack: err.stack!,
					},
				},
			};
			({ modifiedCount } = await this.coll.updateOne({
				_id: doc._id,
				state: Document.State.ADOPTED,
			}, {
				$set: {
					'state': Document.State.FAILED,
					'failTime': Date.now(),
					'response': res,
				}
			}, { session }));

			await session.commitTransaction();
		} catch (error) {
			await session.abortTransaction();
			throw error;
		} finally {
			await session.endSession();
		}

		assert(modifiedCount === 1, new AdoptedTaskNotFound());
	}
}

export namespace Failure {
	export class AdoptedTaskNotFound extends Error { }
}

import AdoptedTaskNotFound = Failure.AdoptedTaskNotFound;
