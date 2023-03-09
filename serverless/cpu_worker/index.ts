import { AzureFunction, Context, HttpRequest } from "@azure/functions"

const cpuWorker: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.res = { status: 200, body: req.body };
};

export default cpuWorker;