/**
 * External dependencies
 */
import { interpret } from 'xstate';
import { waitFor } from 'xstate/lib/waitFor';

/**
 * Internal dependencies
 */
import { designWithNoAiStateMachineDefinition } from '../state-machine';

const createMockMachine = ( {
	services,
	guards,
	actions,
}: Parameters<
	typeof designWithNoAiStateMachineDefinition.withConfig
>[ 0 ] ) => {
	const machineWithConfig = designWithNoAiStateMachineDefinition.withConfig( {
		services,
		guards,
		actions,
	} );

	return machineWithConfig;
};

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

describe( 'Design Without AI state machine', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'navigate state', () => {
		it( 'should start with the navigate state', async () => {
			const expectedValue = 'navigate';

			const actualState =
				designWithNoAiStateMachineDefinition.initialState;

			expect( actualState.matches( expectedValue ) ).toBeTruthy();
		} );

		it( 'should check the url', () => {
			const hasStepInUrl = jest.fn( () => true );
			const machine = designWithNoAiStateMachineDefinition.withConfig( {
				guards: {
					hasStepInUrl,
				},
			} );

			interpret( machine ).start();

			expect( hasStepInUrl ).toBeCalled();
		} );

		it( 'should transit to preAssembleSite state when the url is /design', () => {
			const hasStepInUrl = jest.fn( () => true );
			const machine = designWithNoAiStateMachineDefinition.withConfig( {
				guards: {
					hasStepInUrl,
				},
			} );

			const machineInterpret = interpret( machine ).start();

			expect(
				machineInterpret.getSnapshot().matches( 'preAssembleSite' )
			).toBeTruthy();
		} );

		it( "should not transit to preAssembleSite state when the url isn't /design", () => {
			const hasStepInUrl = jest.fn( () => false );
			const machine = designWithNoAiStateMachineDefinition.withConfig( {
				guards: {
					hasStepInUrl,
				},
			} );

			const machineInterpret = interpret( machine ).start();

			expect(
				machineInterpret.getSnapshot().matches( 'preAssembleSite' )
			).toBeFalsy();
		} );
	} );

	describe( 'preAssembleSite state', () => {
		it( 'should invoke `installAndActivateTheme` service', async () => {
			const initialState =
				'preAssembleSite.preApiCallLoader.installAndActivateTheme';
			const installAndActivateThemeMock = jest.fn( () =>
				Promise.resolve()
			);

			const machine = createMockMachine( {
				services: {
					installAndActivateTheme: installAndActivateThemeMock,
				},
			} );

			const state = machine.getInitialState( initialState );

			const actor = interpret( machine ).start( state );

			await waitFor( actor, ( currentState ) => {
				return currentState.matches(
					'preAssembleSite.preApiCallLoader.installAndActivateTheme.pending'
				);
			} );

			expect( installAndActivateThemeMock ).toHaveBeenCalled();

			const finalState = await waitFor( actor, ( currentState ) => {
				return currentState.matches(
					'preAssembleSite.preApiCallLoader.installAndActivateTheme.success'
				);
			} );

			expect(
				finalState.matches(
					'preAssembleSite.preApiCallLoader.installAndActivateTheme.success'
				)
			).toBeTruthy();
		} );

		it( 'should invoke `assembleSite` service', async () => {
			const initialState =
				'preAssembleSite.preApiCallLoader.assembleSite';

			const assembleSiteMock = jest.fn( () => Promise.resolve() );

			const machine = createMockMachine( {
				services: {
					assembleSite: assembleSiteMock,
				},
			} );

			const state = machine.getInitialState( initialState );

			const actor = interpret( machine ).start( state );

			await waitFor( actor, ( currentState ) => {
				return currentState.matches(
					'preAssembleSite.preApiCallLoader.assembleSite.pending'
				);
			} );

			expect( assembleSiteMock ).toHaveBeenCalled();

			const finalState = await waitFor( actor, ( currentState ) => {
				return currentState.matches(
					'preAssembleSite.preApiCallLoader.assembleSite.success'
				);
			} );

			expect(
				finalState.matches(
					'preAssembleSite.preApiCallLoader.assembleSite.success'
				)
			).toBeTruthy();
		} );

		it( 'should invoke `createProducts` service', async () => {
			const initialState =
				'preAssembleSite.preApiCallLoader.createProducts';

			const createProductsMock = jest.fn( () => Promise.resolve() );

			const machine = createMockMachine( {
				services: {
					createProducts: createProductsMock,
				},
			} );

			const state = machine.getInitialState( initialState );

			const actor = interpret( machine ).start( state );

			await waitFor( actor, ( currentState ) => {
				return currentState.matches(
					'preAssembleSite.preApiCallLoader.createProducts.pending'
				);
			} );

			expect( createProductsMock ).toHaveBeenCalled();

			const finalState = await waitFor( actor, ( currentState ) => {
				return currentState.matches(
					'preAssembleSite.preApiCallLoader.createProducts.success'
				);
			} );

			expect(
				finalState.matches(
					'preAssembleSite.preApiCallLoader.createProducts.success'
				)
			).toBeTruthy();
		} );

		// We have to refactor this test with  https://github.com/woocommerce/woocommerce/issues/43780
		it.skip( 'should run `assignAPICallLoaderError` when `assembleSite` service fails', async () => {
			const assembleSiteMock = jest.fn( () => Promise.reject() );
			const assignAPICallLoaderErrorMock = jest.fn();

			const machine = createMockMachine( {
				services: {
					assembleSite: assembleSiteMock,
				},
				actions: {
					assignAPICallLoaderError: assignAPICallLoaderErrorMock,
				},
			} );

			const state = machine.getInitialState( 'preAssembleSite' );

			const actor = interpret( machine );

			const services = actor.start( state );

			await waitFor( services, ( currentState ) =>
				currentState.matches( 'preAssembleSite.assembleSite.pending' )
			);

			expect( assembleSiteMock ).toHaveBeenCalled();
			expect( assignAPICallLoaderErrorMock ).toHaveBeenCalled();
		} );
	} );
} );
