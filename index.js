import axios from 'axios';

const CUSTOMER_SEARCH_URL = "http://a558f03c75ec3430aa2d7855858dde5a-1052619165.us-east-1.elb.amazonaws.com/customers/search";
const ORDER_CREATE_URL = "http://a558f03c75ec3430aa2d7855858dde5a-1052619165.us-east-1.elb.amazonaws.com/orders/create";

export const handler = async (event) => {
    try {
        // Log para verificar o conteúdo do evento
        console.log("Evento recebido:", JSON.stringify(event)); // Log do evento completo

        if (!event.body) {
            console.error("Corpo da requisição não encontrado");
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Corpo da requisição não encontrado" })
            };
        }

        // Log para verificar o corpo da requisição
        console.log("Corpo da requisição:", event.body);

        const body = JSON.parse(event.body);  // Convertendo o corpo para JSON
        console.log("Corpo da requisição processado:", JSON.stringify(body));  // Log após processamento

        const document = body.document;
        const items = body.items;

        if (!items || items.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "O campo 'items' não pode estar vazio." })
            };
        }

        // Validação do documento
        if (document) {
            try {
                // Montando a URL com o documento
                const url = `${CUSTOMER_SEARCH_URL}/${document}`;
                console.log("URL de busca:", url);
        
                const validationResponse = await axios.get(url);
                console.log("Resposta de validação do documento:", validationResponse.status);
            } catch (error) {
                if (error.response) {
                    const statusCode = error.response.status;
        
                    // Tratamento para status 400 - Requisição inválida com `violations`
                    if (statusCode === 400) {
                        const violations = error.response.data.violations;
                        const violationMessage = violations?.[0]?.message || "Erro na validação do documento.";
                        console.warn("Validação do documento falhou:", violationMessage);
        
                        return {
                            statusCode: 400,
                            body: JSON.stringify({
                                message: "Erro ao validar o documento.",
                                details: violationMessage,
                                document: document
                            })
                        };
                    }
        
                    // Tratamento para outros erros conhecidos (exemplo: 404)
                    if (statusCode === 404) {
                        console.warn("Documento não encontrado:", document);
                        return {
                            statusCode: 404,
                            body: JSON.stringify({
                                message: "Documento não encontrado.",
                                document: document
                            })
                        };
                    }
                }
        
                // Outros erros
                console.error("Erro ao validar o documento:", error.message);
                return {
                    statusCode: 500,
                    body: JSON.stringify({
                        message: "Erro interno ao validar o documento.",
                        error: error.message
                    })
                };
            }
        }

        // Criação do pedido
        const orderPayload = { document, items };
        const orderResponse = await axios.post(ORDER_CREATE_URL, orderPayload);

        if (orderResponse.status === 201) {
            return {
                statusCode: 201,
                body: JSON.stringify({
                    message: "Ordem criada com sucesso.",
                    orderResponse: orderResponse.data
                })
            };
        } else {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    message: "Erro ao criar a ordem.",
                    orderResponse: orderResponse.data
                })
            };
        }
    } catch (error) {
        console.error("Erro na execução:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Erro interno no servidor.",
                error: error.message
            })
        };
    }
};
