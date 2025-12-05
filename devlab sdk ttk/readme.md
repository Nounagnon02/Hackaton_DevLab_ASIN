# SDK test

## Architecture

```mermaid
graph
  payment-system --> SDK --> TTK
```


## SDK ports

- **Port 4000**: Inbound API (receives requests from Mojaloop)
- **Port 4001**: Outbound API (sends requests to Mojaloop) - **Use this for transfers**
- **Port 4002**: Test API

## Test

```bash
curl http://localhost:4001/parties/MSISDN/22912345678 | jq .


curl -X POST \
  http://localhost:4001/transfers \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{
    "from": {
        "displayName": "John Doe",
        "idType": "MSISDN", 
        "idValue": "123456789"
    },
    "to": {
        "idType": "PERSONAL_ID",
        "idValue": "22912345678"
    },
    "amountType": "SEND",
    "currency": "XOF",
    "amount": "100",
    "transactionType": "TRANSFER",
    "note": "testpayment",
    "homeTransactionId": "'$(uuidgen || echo "test-$(date +%s)")'"
  }' | jq .

```

https://docs.mojaloop.io/api/fspiop/v1.1/api-definition.html#partyidtype-enum


```json
{
  "from": {
    "displayName": "John Doe",
    "idType": "MSISDN",
    "idValue": "123456789"
  },
  "to": {
    "idType": "PERSONAL_ID",
    "idValue": "22912345678",
    "fspId": "testingtoolkitdfsp",
    "extensionList": [
      {
        "officia33": -65259351.968746014,
        "veniam_7e1": false,
        "estb": false,
        "Lorem685": true,
        "ipsum_9": -64543902.23691444,
        "exc__": true,
        "key": "eiu",
        "value": "pariatur elit officia"
      },
      {
        "dolor_d": -75968946,
        "Lorem70": true,
        "key": "sit aliqua",
        "value": "Exc"
      }
    ],
    "firstName": "Michael",
    "middleName": "N",
    "lastName": "Lee",
    "dateOfBirth": "1922-10-05"
  },
  "amountType": "SEND",
  "currency": "XOF",
  "amount": "100",
  "transactionType": "TRANSFER",
  "note": "testpayment",
  "homeTransactionId": "76287077-ECAE-4FFF-8E11-93BA118E2EC9",
  "transferId": "01KBKZJ9HD3M2DNT7AKW455P17",
  "traceId": "692698a88d3ceb33988797e600c4e5ca",
  "currentState": "COMPLETED",
  "initiatedTimestamp": "2025-12-04T06:07:36.496Z",
  "direction": "OUTBOUND",
  "getPartiesRequest": {
    "withCredentials": false,
    "transitional": {
      "clarifyTimeoutError": true
    },
    "method": "GET",
    "baseURL": "http://ml-testing-toolkit:4040",
    "url": "/parties/PERSONAL_ID/22912345678",
    "headers": {
      "content-type": "application/vnd.interoperability.parties+json;version=1.0",
      "date": "Thu, 04 Dec 2025 06:07:36 GMT",
      "fspiop-source": "itk-load-test-dfsp",
      "Authorization": "Bearer 7718fa9b-be13-3fe7-87f0-a12cf1628168",
      "accept": "application/vnd.interoperability.parties+json;version=1",
      "traceparent": "00-692698a88d3ceb33988797e600c4e5ca-c966780fca880587-01"
    },
    "httpAgent": "[REDACTED]"
  },
  "getPartiesResponse": {
    "body": {
      "Excepteur_d15": -39487209,
      "dolor_0": 99614356.70058095,
      "ullamco4": "non aliqua voluptate",
      "exb8": 12570446,
      "consequat_d": true,
      "party": {
        "partyIdInfo": {
          "partyIdType": "PERSONAL_ID",
          "partyIdentifier": "22912345678",
          "fspId": "testingtoolkitdfsp",
          "extensionList": {
            "labore3": "officia nisi Duis",
            "id8a6": 31854064.496756166,
            "labore2": "sed amet velit aute cillum",
            "tempor54": 75469323.35321349,
            "extension": [
              {
                "officia33": -65259351.968746014,
                "veniam_7e1": false,
                "estb": false,
                "Lorem685": true,
                "ipsum_9": -64543902.23691444,
                "exc__": true,
                "key": "eiu",
                "value": "pariatur elit officia"
              },
              {
                "dolor_d": -75968946,
                "Lorem70": true,
                "key": "sit aliqua",
                "value": "Exc"
              }
            ]
          }
        },
        "merchantClassificationCode": "6706",
        "name": "nuP.kt,{koJak==pecn,C'giLtlu dC=nnMe cip,td-gaCLl }e cktacnMPPo}paPpn MP,Jag={k=Jtnng.kl=Pr=uett{eg",
        "personalInfo": {
          "complexName": {
            "firstName": "Michael",
            "middleName": "N",
            "lastName": "Lee"
          },
          "dateOfBirth": "1922-10-05"
        }
      }
    },
    "headers": {
      "content-type": "application/vnd.interoperability.parties+json;version=1.0",
      "date": "Thu, 04 Dec 2025 06:07:36 GMT",
      "x-forwarded-for": "non reprehenderit",
      "fspiop-source": "testingtoolkitdfsp",
      "fspiop-destination": "itk-load-test-dfsp",
      "fspiop-encryption": "amet Lorem",
      "fspiop-signature": "voluptate",
      "fspiop-uri": "culpa sit amet incididunt",
      "fspiop-http-method": "minim amet cillum quis ipsum",
      "traceparent": "00-692698a88d3ceb33988797e600c4e5ca-c966780fca880587-01",
      "user-agent": "axios/1.13.2",
      "content-length": 895,
      "accept-encoding": "gzip, compress, deflate, br",
      "host": "mojaloop-connector-load-test:4000",
      "connection": "keep-alive"
    }
  },
  "quoteId": "01KBKZJAM060G7BTW4VP72AM0N",
  "quoteRequest": {
    "body": {
      "quoteId": "01KBKZJAM060G7BTW4VP72AM0N",
      "transactionId": "01KBKZJ9HD3M2DNT7AKW455P17",
      "amountType": "SEND",
      "amount": {
        "currency": "XOF",
        "amount": "100"
      },
      "expiration": "2025-12-04T06:08:37.601Z",
      "payer": {
        "partyIdInfo": {
          "partyIdType": "MSISDN",
          "partyIdentifier": "123456789",
          "fspId": "itk-load-test-dfsp"
        },
        "name": "John Doe"
      },
      "payee": {
        "partyIdInfo": {
          "partyIdType": "PERSONAL_ID",
          "partyIdentifier": "22912345678",
          "fspId": "testingtoolkitdfsp",
          "extensionList": {
            "extension": [
              {
                "officia33": -65259351.968746014,
                "veniam_7e1": false,
                "estb": false,
                "Lorem685": true,
                "ipsum_9": -64543902.23691444,
                "exc__": true,
                "key": "eiu",
                "value": "pariatur elit officia"
              },
              {
                "dolor_d": -75968946,
                "Lorem70": true,
                "key": "sit aliqua",
                "value": "Exc"
              }
            ]
          }
        },
        "personalInfo": {
          "complexName": {
            "firstName": "Michael",
            "middleName": "N",
            "lastName": "Lee"
          },
          "dateOfBirth": "1922-10-05"
        }
      },
      "transactionType": {
        "scenario": "TRANSFER",
        "initiator": "PAYER",
        "initiatorType": "CONSUMER"
      },
      "note": "testpayment"
    },
    "headers": {
      "content-type": "application/vnd.interoperability.quotes+json;version=1.0",
      "date": "Thu, 04 Dec 2025 06:07:37 GMT",
      "fspiop-source": "itk-load-test-dfsp",
      "fspiop-destination": "testingtoolkitdfsp",
      "Authorization": "Bearer 7718fa9b-be13-3fe7-87f0-a12cf1628168",
      "accept": "application/vnd.interoperability.quotes+json;version=1",
      "traceparent": "00-692698a88d3ceb33988797e600c4e5ca-cea7c2915a9a4ffc-01",
      "fspiop-http-method": "POST",
      "fspiop-uri": "/quotes",
      "fspiop-signature": "{\"signature\":\"QYMHBzL8Ol49XPz-0aZCztNA5dpgW7eRBbMhSDt50XvCcZfTr7Qlky-QR7wj5szHVf14zPFQ95tggyZ2CUyjAJszCmMp8mEK9T33xkK4T5sQFzxHoT8D7Xm6N5fqjGlbBFocluC9bL6EIkv-z4MIHteNSoEQhWgiscdgC7GfhKEX38QH9UqxyzDmEXSXv8KgnSJR-ip3TXNlLLXffKaOm3T8ef18ocvSuBqZwTqqHUF__HIM_11Hb4BLokgq1udVvGdI148Eu7_m-EOqE_OmOyhE-fAiLmR3r7-7kIvDFQ9_6selWcqkfWM4OhIOFiDR-Ub_K4PGyLXG7_Ne7KfPwg\",\"protectedHeader\":\"eyJhbGciOiJSUzI1NiIsIkZTUElPUC1VUkkiOiIvcXVvdGVzIiwiRlNQSU9QLUhUVFAtTWV0aG9kIjoiUE9TVCIsIkZTUElPUC1Tb3VyY2UiOiJpdGstbG9hZC10ZXN0LWRmc3AiLCJGU1BJT1AtRGVzdGluYXRpb24iOiJ0ZXN0aW5ndG9vbGtpdGRmc3AiLCJEYXRlIjoiVGh1LCAwNCBEZWMgMjAyNSAwNjowNzozNyBHTVQifQ\"}"
    }
  },
  "quoteResponse": {
    "headers": {
      "content-type": "application/vnd.interoperability.quotes+json;version=1.1",
      "date": "Thu, 04 Dec 2025 06:07:37 GMT",
      "x-forwarded-for": "dolor do",
      "fspiop-source": "testingtoolkitdfsp",
      "fspiop-destination": "itk-load-test-dfsp",
      "fspiop-encryption": "incididunt culpa in",
      "fspiop-signature": "aliquip in",
      "fspiop-uri": "Duis pariatur Lorem ullamco eiusmod",
      "fspiop-http-method": "elit non cillum laboris",
      "traceparent": "00-692698a88d3ceb33988797e600c4e5ca-cea7c2915a9a4ffc-01",
      "user-agent": "axios/1.13.2",
      "content-length": 2449,
      "accept-encoding": "gzip, compress, deflate, br",
      "host": "mojaloop-connector-load-test:4000",
      "connection": "keep-alive"
    },
    "body": {
      "transferAmount": {
        "sint781": false,
        "currency": "XOF",
        "amount": "100"
      },
      "payeeReceiveAmount": {
        "quis3b1": "id et eiusmod irure",
        "laborum40": -16431852,
        "commodo1": -76293914,
        "enim_5": true,
        "magna_26": "magna sed velit Ut adipisicing",
        "dolor16": true,
        "currency": "XOF",
        "amount": "99.7"
      },
      "payeeFspFee": {
        "pariatur_7": "do",
        "currency": "XOF",
        "amount": "0.5"
      },
      "payeeFspCommission": {
        "pariatur_8": 28274899.356608823,
        "sunt_72": -72571373.95905668,
        "est_5df": -41124954,
        "amet_ed8": true,
        "currency": "XOF",
        "amount": "0.2"
      },
      "expiration": "2025-12-05T06:07:37.670Z",
      "geoCode": {
        "qui_1": "ipsum incididunt pariatur non mollit",
        "ex_46a": 98514591.52760503,
        "utc": 24927911,
        "Ut_b0b": -14691097.611405984,
        "latitude": "90",
        "longitude": "-11"
      },
      "ilpPacket": "AYIE6QAAAAAAAABkLGcudGVzdGluZ3Rvb2xraXRkZnNwLnBlcnNvbmFsX2lkLjIyOTEyMzQ1Njc4ggSwZXlKMGNtRnVjMkZqZEdsdmJrbGtJam9pTURGTFFrdGFTamxJUkROTk1rUk9WRGRCUzFjME5UVlFNVGNpTENKeGRXOTBaVWxrSWpvaU1ERkxRa3RhU2tGTk1EWXdSemRDVkZjMFZsQTNNa0ZOTUU0aUxDSndZWGxsWlNJNmV5SndZWEowZVVsa1NXNW1ieUk2ZXlKd1lYSjBlVWxrVkhsd1pTSTZJbEJGVWxOUFRrRk1YMGxFSWl3aWNHRnlkSGxKWkdWdWRHbG1hV1Z5SWpvaU1qSTVNVEl6TkRVMk56Z2lMQ0ptYzNCSlpDSTZJblJsYzNScGJtZDBiMjlzYTJsMFpHWnpjQ0lzSW1WNGRHVnVjMmx2Ymt4cGMzUWlPbnNpWlhoMFpXNXphVzl1SWpwYmV5SnZabVpwWTJsaE16TWlPaTAyTlRJMU9UTTFNUzQ1TmpnM05EWXdNVFFzSW5abGJtbGhiVjgzWlRFaU9tWmhiSE5sTENKbGMzUmlJanBtWVd4elpTd2lURzl5WlcwMk9EVWlPblJ5ZFdVc0ltbHdjM1Z0WHpraU9pMDJORFUwTXprd01pNHlNelk1TVRRME5Dd2laWGhqWDE4aU9uUnlkV1VzSW10bGVTSTZJbVZwZFNJc0luWmhiSFZsSWpvaWNHRnlhV0YwZFhJZ1pXeHBkQ0J2Wm1acFkybGhJbjBzZXlKa2IyeHZjbDlrSWpvdE56VTVOamc1TkRZc0lreHZjbVZ0TnpBaU9uUnlkV1VzSW10bGVTSTZJbk5wZENCaGJHbHhkV0VpTENKMllXeDFaU0k2SWtWNFl5SjlYWDE5TENKd1pYSnpiMjVoYkVsdVptOGlPbnNpWTI5dGNHeGxlRTVoYldVaU9uc2labWx5YzNST1lXMWxJam9pVFdsamFHRmxiQ0lzSW0xcFpHUnNaVTVoYldVaU9pSk9JaXdpYkdGemRFNWhiV1VpT2lKTVpXVWlmU3dpWkdGMFpVOW1RbWx5ZEdnaU9pSXhPVEl5TFRFd0xUQTFJbjE5TENKd1lYbGxjaUk2ZXlKd1lYSjBlVWxrU1c1bWJ5STZleUp3WVhKMGVVbGtWSGx3WlNJNklrMVRTVk5FVGlJc0luQmhjblI1U1dSbGJuUnBabWxsY2lJNklqRXlNelExTmpjNE9TSXNJbVp6Y0Vsa0lqb2lhWFJyTFd4dllXUXRkR1Z6ZEMxa1puTndJbjBzSW01aGJXVWlPaUpLYjJodUlFUnZaU0o5TENKaGJXOTFiblFpT25zaWMybHVkRGM0TVNJNlptRnNjMlVzSW1OMWNuSmxibU41SWpvaVdFOUdJaXdpWVcxdmRXNTBJam9pTVRBd0luMHNJblJ5WVc1ellXTjBhVzl1Vkhsd1pTSTZleUp6WTJWdVlYSnBieUk2SWxSU1FVNVRSa1ZTSWl3aWFXNXBkR2xoZEc5eUlqb2lVRUZaUlZJaUxDSnBibWwwYVdGMGIzSlVlWEJsSWpvaVEwOU9VMVZOUlZJaWZTd2laWGh3YVhKaGRHbHZiaUk2SWpJd01qVXRNVEl0TURWVU1EWTZNRGM2TXpjdU5qY3dXaUo5AA",
      "condition": "6el1iYAyOxEt83DFhnEJQU550fUFfckbuBVS4GChqEc"
    },
    "originalIso20022QuoteResponse": {}
  },
  "quoteResponseSource": "testingtoolkitdfsp",
  "prepare": {
    "body": {
      "transferId": "01KBKZJ9HD3M2DNT7AKW455P17",
      "payeeFsp": "testingtoolkitdfsp",
      "payerFsp": "itk-load-test-dfsp",
      "amount": {
        "currency": "XOF",
        "amount": "100"
      },
      "ilpPacket": "AYIE6QAAAAAAAABkLGcudGVzdGluZ3Rvb2xraXRkZnNwLnBlcnNvbmFsX2lkLjIyOTEyMzQ1Njc4ggSwZXlKMGNtRnVjMkZqZEdsdmJrbGtJam9pTURGTFFrdGFTamxJUkROTk1rUk9WRGRCUzFjME5UVlFNVGNpTENKeGRXOTBaVWxrSWpvaU1ERkxRa3RhU2tGTk1EWXdSemRDVkZjMFZsQTNNa0ZOTUU0aUxDSndZWGxsWlNJNmV5SndZWEowZVVsa1NXNW1ieUk2ZXlKd1lYSjBlVWxrVkhsd1pTSTZJbEJGVWxOUFRrRk1YMGxFSWl3aWNHRnlkSGxKWkdWdWRHbG1hV1Z5SWpvaU1qSTVNVEl6TkRVMk56Z2lMQ0ptYzNCSlpDSTZJblJsYzNScGJtZDBiMjlzYTJsMFpHWnpjQ0lzSW1WNGRHVnVjMmx2Ymt4cGMzUWlPbnNpWlhoMFpXNXphVzl1SWpwYmV5SnZabVpwWTJsaE16TWlPaTAyTlRJMU9UTTFNUzQ1TmpnM05EWXdNVFFzSW5abGJtbGhiVjgzWlRFaU9tWmhiSE5sTENKbGMzUmlJanBtWVd4elpTd2lURzl5WlcwMk9EVWlPblJ5ZFdVc0ltbHdjM1Z0WHpraU9pMDJORFUwTXprd01pNHlNelk1TVRRME5Dd2laWGhqWDE4aU9uUnlkV1VzSW10bGVTSTZJbVZwZFNJc0luWmhiSFZsSWpvaWNHRnlhV0YwZFhJZ1pXeHBkQ0J2Wm1acFkybGhJbjBzZXlKa2IyeHZjbDlrSWpvdE56VTVOamc1TkRZc0lreHZjbVZ0TnpBaU9uUnlkV1VzSW10bGVTSTZJbk5wZENCaGJHbHhkV0VpTENKMllXeDFaU0k2SWtWNFl5SjlYWDE5TENKd1pYSnpiMjVoYkVsdVptOGlPbnNpWTI5dGNHeGxlRTVoYldVaU9uc2labWx5YzNST1lXMWxJam9pVFdsamFHRmxiQ0lzSW0xcFpHUnNaVTVoYldVaU9pSk9JaXdpYkdGemRFNWhiV1VpT2lKTVpXVWlmU3dpWkdGMFpVOW1RbWx5ZEdnaU9pSXhPVEl5TFRFd0xUQTFJbjE5TENKd1lYbGxjaUk2ZXlKd1lYSjBlVWxrU1c1bWJ5STZleUp3WVhKMGVVbGtWSGx3WlNJNklrMVRTVk5FVGlJc0luQmhjblI1U1dSbGJuUnBabWxsY2lJNklqRXlNelExTmpjNE9TSXNJbVp6Y0Vsa0lqb2lhWFJyTFd4dllXUXRkR1Z6ZEMxa1puTndJbjBzSW01aGJXVWlPaUpLYjJodUlFUnZaU0o5TENKaGJXOTFiblFpT25zaWMybHVkRGM0TVNJNlptRnNjMlVzSW1OMWNuSmxibU41SWpvaVdFOUdJaXdpWVcxdmRXNTBJam9pTVRBd0luMHNJblJ5WVc1ellXTjBhVzl1Vkhsd1pTSTZleUp6WTJWdVlYSnBieUk2SWxSU1FVNVRSa1ZTSWl3aWFXNXBkR2xoZEc5eUlqb2lVRUZaUlZJaUxDSnBibWwwYVdGMGIzSlVlWEJsSWpvaVEwOU9VMVZOUlZJaWZTd2laWGh3YVhKaGRHbHZiaUk2SWpJd01qVXRNVEl0TURWVU1EWTZNRGM2TXpjdU5qY3dXaUo5AA",
      "condition": "6el1iYAyOxEt83DFhnEJQU550fUFfckbuBVS4GChqEc",
      "expiration": "2025-12-04T06:08:38.261Z"
    },
    "headers": {
      "content-type": "application/vnd.interoperability.transfers+json;version=1.1",
      "date": "Thu, 04 Dec 2025 06:07:38 GMT",
      "fspiop-source": "itk-load-test-dfsp",
      "fspiop-destination": "testingtoolkitdfsp",
      "Authorization": "Bearer 7718fa9b-be13-3fe7-87f0-a12cf1628168",
      "accept": "application/vnd.interoperability.transfers+json;version=1",
      "traceparent": "00-692698a88d3ceb33988797e600c4e5ca-b4714f4c38e7db63-01",
      "fspiop-http-method": "POST",
      "fspiop-uri": "/transfers",
      "fspiop-signature": "{\"signature\":\"Aj-wP1wZ3f8TBx1XJk5ZvuCzJ7YYboICRwHt2F-ra7jYGD7wj-Jfk2ekW65ro0aOmhLfhgBYyBZ35qcMWMovf_yfzcOcMc4VbaQwrfeo5oOWRu6qxCJ_noYGKe_h74jqdFX_mWIBMc8mSyFRdhozHWA6h1rR6XO9yPviUg4jBKdNmumeP2nINp1vwuxTStzzJaV9i20npRt-6firFJqxZoew9bI2Wmr1AqjB7hkmlvHtfJUFvTYo0eLWqZf0nt9ACOs-HzjmtqaDkd6wh_XvVLT5Ll48_Xcef5ekvr-mFQOY892EmAfyzHjpSdyqSSbYCpWaWMV_xCKHKFIIYhL4hA\",\"protectedHeader\":\"eyJhbGciOiJSUzI1NiIsIkZTUElPUC1VUkkiOiIvdHJhbnNmZXJzIiwiRlNQSU9QLUhUVFAtTWV0aG9kIjoiUE9TVCIsIkZTUElPUC1Tb3VyY2UiOiJpdGstbG9hZC10ZXN0LWRmc3AiLCJGU1BJT1AtRGVzdGluYXRpb24iOiJ0ZXN0aW5ndG9vbGtpdGRmc3AiLCJEYXRlIjoiVGh1LCAwNCBEZWMgMjAyNSAwNjowNzozOCBHTVQifQ\"}"
    }
  },
  "fulfil": {
    "body": {
      "fulfilment": "jxGOLSWZXtCG1Lm6Zg_PDGZ1wKwapwUe5qglFhQecjE",
      "completedTimestamp": "2025-12-04T06:07:38.809Z",
      "transferState": "COMMITTED"
    },
    "headers": {
      "content-type": "application/vnd.interoperability.transfers+json;version=1.1",
      "date": "Thu, 04 Dec 2025 06:07:38 GMT",
      "x-forwarded-for": "exercitation consectetur",
      "fspiop-source": "testingtoolkitdfsp",
      "fspiop-destination": "itk-load-test-dfsp",
      "fspiop-encryption": "esse cillum amet cupidatat occaecat",
      "fspiop-signature": "anim adipisicing consectetur in magna",
      "fspiop-uri": "aute in incididunt",
      "fspiop-http-method": "qui mollit dolor",
      "traceparent": "00-692698a88d3ceb33988797e600c4e5ca-b4714f4c38e7db63-01",
      "user-agent": "axios/1.13.2",
      "content-length": 136,
      "accept-encoding": "gzip, compress, deflate, br",
      "host": "mojaloop-connector-load-test:4000",
      "connection": "keep-alive"
    }
  }
}
```