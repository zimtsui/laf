import { ChangeStream, ChangeStreamDocument } from "mongodb";
import { Document } from "../interfaces";
import { Adoption } from "./adoption";
import { Failure } from "./failure";
import { Success } from "./success";
import { $, AsRawStart, AsRawStop } from "@zimtsui/startable";
import { Pollerloop } from "@zimtsui/pollerloop";
import { nodeTimeEngine } from "@zimtsui/node-time-engine";


interface Execute<
	params extends readonly unknown[],
	result,
> {
	(...params: params): Promise<result>;
}

export class Executor<
	method extends string,
	params extends readonly unknown[],
	result,
>  {
	private pollerloop: Pollerloop;

	public constructor(
		private stream: ChangeStream<Document, ChangeStreamDocument<Document>>,
		private adoption: Adoption,
		private success: Success,
		private failure: Failure,
		private method: method,
		private execute: Execute<params, result>,
	) {
		this.pollerloop = new Pollerloop(this.loop, nodeTimeEngine);
	}

	private listener = async (notif: ChangeStreamDocument<Document>) => {
		if (notif.operationType !== 'insert') return;
		if (notif.fullDocument.request.method !== this.method) return;

		// TODO catch
		const doc = await this.adoption.adopt<method, params>(this.method);
		await this.execute(...doc.request.params).then(
			result => void this.success.succeed(doc, result),
			(err: Error) => void this.failure.fail(doc, err),
		);
	}

	private loop: Pollerloop.Loop = async sleep => {
		try {
			for (; ; await sleep(0)) {
				const doc = await this.adoption.adopt<method, params>(this.method);
				this.execute(...doc.request.params).then(
					result => void this.success.succeed(doc, result),
					(err: Error) => void this.failure.fail(doc, err),
				);
			}
		} catch (err) {
			if (err instanceof Adoption.OrphanNotFound) { }
			else throw err;
		}
	}

	@AsRawStart()
	private async rawStart() {
		this.stream.on('change', this.listener);
		await $(this.pollerloop).start($(this).stop);
	}

	@AsRawStop()
	private async rawStop() {
		this.stream.off('change', this.listener);
		await $(this.pollerloop).stop();
	}
}