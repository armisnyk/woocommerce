/**
 * External dependencies
 */
import { EventObject, createMachine } from 'xstate';
import { getQuery } from '@woocommerce/navigation';

/**
 * Internal dependencies
 */

import { ApiCallLoader, AssembleHubLoader } from './pages/ApiCallLoader';

import { FlowType } from '../types';
import { DesignWithoutAIStateMachineContext } from './types';
import { services } from './services';
import { actions } from './actions';

export const hasStepInUrl = (
	_ctx: unknown,
	_evt: unknown,
	{ cond }: { cond: unknown }
) => {
	const { path = '' } = getQuery() as { path: string };
	const pathFragments = path.split( '/' );
	return (
		pathFragments[ 2 ] === // [0] '', [1] 'customize-store', [2] design step slug
		( cond as { step: string | undefined } ).step
	);
};

export const designWithNoAiStateMachineDefinition = createMachine(
	{
		id: 'designWithoutAI',
		predictableActionArguments: true,
		preserveActionOrder: true,
		schema: {
			context: {} as DesignWithoutAIStateMachineContext,
			events: {} as EventObject,
		},
		invoke: {
			src: 'browserPopstateHandler',
		},
		on: {
			EXTERNAL_URL_UPDATE: {
				target: 'navigate',
			},
		},
		context: {
			startLoadingTime: null,
			flowType: FlowType.noAI,
			apiCallLoader: {
				hasErrors: false,
			},
		},
		initial: 'navigate',
		states: {
			navigate: {
				always: [
					{
						cond: {
							type: 'hasStepInUrl',
							step: 'design',
						},
						target: 'preAssembleSite',
					},
				],
			},
			preAssembleSite: {
				initial: 'preApiCallLoader',
				id: 'preAssembleSite',
				states: {
					preApiCallLoader: {
						meta: {
							// @todo: Move the current component in a common folder or create a new one dedicated to this flow.
							component: ApiCallLoader,
						},
						type: 'parallel',
						states: {
							installAndActivateTheme: {
								initial: 'pending',
								states: {
									pending: {
										invoke: {
											src: 'installAndActivateTheme',
											onDone: {
												target: 'success',
											},
											// TODO: Handle error case: https://github.com/woocommerce/woocommerce/issues/43780
											// onError: {
											// 	actions: [
											// 		'assignAPICallLoaderError',
											// 	],
											// },
										},
									},
									success: { type: 'final' },
								},
							},
							assembleSite: {
								initial: 'pending',
								states: {
									pending: {
										invoke: {
											src: 'assembleSite',
											onDone: {
												target: 'success',
											},
											// TODO: Handle error case: https://github.com/woocommerce/woocommerce/issues/43780
											// onError: {
											// 	actions: [
											// 		'assignAPICallLoaderError',
											// 	],
											// },
										},
									},
									success: {
										type: 'final',
									},
								},
							},
							createProducts: {
								initial: 'pending',
								states: {
									pending: {
										invoke: {
											src: 'createProducts',
											onDone: {
												target: 'success',
											},
											// TODO: Handle error case: https://github.com/woocommerce/woocommerce/issues/43780
											// onError: {
											// 	actions: [
											// 		'assignAPICallLoaderError',
											// 	],
											// },
										},
									},
									success: {
										type: 'final',
									},
								},
							},
						},
						onDone: {
							target: '#designWithoutAI.showAssembleHub',
						},
					},
				},
			},
			showAssembleHub: {
				id: 'showAssembleHub',
				meta: {
					component: AssembleHubLoader,
				},
				entry: [ 'redirectToAssemblerHub' ],
				type: 'final',
			},
		},
	},
	{
		actions,
		services,
		guards: {
			hasStepInUrl,
		},
	}
);
