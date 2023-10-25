import "../index.html"
import "../style/index.scss"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const requestInfo = {
	PROCESSING_FUNCTION_URL: "https://functions.yandexcloud.net/d4e8fianhgiumspr12b7?integration=raw",
	RESULT_FUNCTION_URL: "https://functions.yandexcloud.net/d4e53fun2jdt7tdpj3pv?integration=raw",
	fileName: '',
	operationId: '',
}
const loaderContainer = document.getElementsByClassName('container container_loader')[0]
const textContainer = document.getElementsByClassName('container container_text')[0]

const form = document.getElementsByClassName("form")[0]
form.addEventListener('submit', async (event) => {
	event.preventDefault()

	const file = new FormData(form).get('file')

	requestInfo.fileName = self.crypto.randomUUID() + ".mp3"
	const params = {
		Bucket: "bucket-for-records", // Имя бакета, например 'sample-bucket-101'.
		Key: requestInfo.fileName, // Имя объекта, например 'sample_upload.txt'.
		Body: file, // Содержимое объекта, например 'Hello world!".
	};

	const REGION = "ru-central1";
	const ENDPOINT = "https://storage.yandexcloud.net";
	const myS3Credentials = {
		accessKeyId: "YCAJEwBqvo52ZP0qz3CdKLDEO",
		secretAccessKey: "YCPBMwQWb4YLt0D-YTN3f2dhdP72QgD9tvHQBUeK",
	};
	const s3Client = new S3Client({
		credentials: myS3Credentials,
		region: REGION,
		endpoint: ENDPOINT
	})

	textContainer.style.display = "none"
	loaderContainer.style.display = "flex"

	await s3Client.send(new PutObjectCommand(params))
		.then(async () => {
			const operationData = await requestProcessing(requestInfo.fileName)
			//console.log(operationData)
			if ("id" in operationData) {
				requestInfo.operationId = operationData.id
				setFetchInterval()
			} else {
				requestInfo.operationId = ""
			}
		})
		.catch(err => {
			console.error(err)
			setResult("Что-то пошло не так...")
		})
})

function setFetchInterval() {
	let delay = 1000

	let timerId = setTimeout(async function request() {
		const data = await fetchResult(requestInfo.operationId)
		//console.log(data)
		if (data.done) {
			const result = unpackData(data.response.chunks)
			setResult(result)
			textContainer.style.display = "flex"
			loaderContainer.style.display = "none"
		} else {
			setResult("Обработка...")
			console.log("Not ready...")

			delay *= 2;
			timerId = setTimeout(request, delay);
		}
	}, delay)
}

function setResult(text) {
	const resultField = document.getElementsByClassName('result')[0]
	resultField.innerHTML = text
}

function unpackData(data) {
	let result = ''
	data.forEach((item) => {
		if (item.channelTag == 1) {
			result += " " + item.alternatives[0].text;
		}
	})
	return result
}

async function requestProcessing(fileName) {
	return await fetch(requestInfo.PROCESSING_FUNCTION_URL, {
		method: 'POST',
		body: JSON.stringify({ file: fileName }),
	}).then((response) => {
		return response.json();
	}).catch(err => {
		console.error(err);
		return { done: false }
	})

}

async function fetchResult(operationId) {
	if (operationId === "") {
		return { done: false }
	}
	return await fetch(requestInfo.RESULT_FUNCTION_URL, {
		method: 'POST',
		body: JSON.stringify({ id: operationId }),
	}).then((response) => {
		return response.json();
	}).catch((err) => {
		console.error(err)
		return { done: false }
	})
}