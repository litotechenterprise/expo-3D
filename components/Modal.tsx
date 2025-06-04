import { CoreSlider } from "@/components/Slider";
import { DEFAULT_MATERIAL_PROPS, MaterialType, statusOptions } from "@/constants";
import { useState } from "react";
import { Button, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

export type CoreModalProps = {
    isVisable: boolean;
    toggle: () => void;
    setMaterialProps: (props: MaterialType) => void;
    materialProps: MaterialType;
}

export const CoreModal = ({isVisable, toggle, setMaterialProps, materialProps}: CoreModalProps) => {
    const [materialState, setMaterialState] = useState<MaterialType>(materialProps);

    const handleSave = () => {
        setMaterialProps(materialState);
        toggle();
    };

    const handleReset = () => {
        setMaterialState(DEFAULT_MATERIAL_PROPS);
        setMaterialProps(DEFAULT_MATERIAL_PROPS);
        toggle();
    };

    return (
        <Modal
        animationType="slide"
        transparent={true}
        visible={isVisable}
        onRequestClose={toggle}>
       <ScrollView style={{flex: 1, backgroundColor: 'white', borderRadius: 10, marginTop: 100, paddingBottom: 40}}>
      
            <Text style={{fontSize: 24, fontWeight: 'bold', marginBottom: 20}}>Material Properties</Text>
            <ScrollView style={{flex: 1, width: '100%', paddingHorizontal: 20}}>
                <View style={{marginBottom: 15}}>
                    <Text>Metalness</Text>
                    <CoreSlider
                        minimumValue={0}
                        maximumValue={1}
                        value={materialState.metalness}
                        onChange={(value) => setMaterialState(prev => ({...prev, metalness: value}))}
                    />
                </View>

                <View style={{marginBottom: 15}}>
                    <Text>Roughness</Text>
                    <CoreSlider
                        minimumValue={0}
                        maximumValue={1}
                        value={materialState.roughness}
                        onChange={(value) => setMaterialState(prev => ({...prev, roughness: value}))}
                    />
                </View>

                <View style={{marginBottom: 15}}>
                    <Text>Clearcoat</Text>
                    <CoreSlider
                        minimumValue={0}
                        maximumValue={1}
                        value={materialState.clearcoat}
                        onChange={(value) => setMaterialState(prev => ({...prev, clearcoat: value}))}
                    />
                </View>

                <View style={{marginBottom: 15}}>
                    <Text>Clearcoat Roughness</Text>
                    <CoreSlider
                        minimumValue={0}
                        maximumValue={1}
                        value={materialState.clearcoatRoughness}
                        onChange={(value) => setMaterialState(prev => ({...prev, clearcoatRoughness: value}))}
                    />
                </View>

                <View style={{marginBottom: 15}}>
                    <Text>Environment Map Intensity</Text>
                    <CoreSlider
                        minimumValue={0}
                        maximumValue={1}
                        value={materialState.envMapIntensity}
                        onChange={(value) => setMaterialState(prev => ({...prev, envMapIntensity: value}))}
                    />
                </View>

                <View style={{marginBottom: 15}}>
                    <Text>Bloom</Text>
                    <CoreSlider
                        minimumValue={0}
                        maximumValue={1}
                        value={materialState.bloom}
                        onChange={(value) => setMaterialState(prev => ({...prev, bloom: value}))}
                    />
                </View>

                <View style={{marginBottom: 15}}>
                    <Text>Luminance Threshold</Text>
                    <CoreSlider
                        minimumValue={0}
                        maximumValue={1}
                        value={materialState.luminanceThreshold}
                        onChange={(value) => setMaterialState(prev => ({...prev, luminanceThreshold: value}))}
                    />
                </View>

                <View style={{marginBottom: 15}}>
                    <Text>Color</Text>
                    <View style={{flexDirection: 'row',  justifyContent: 'space-between'}}>
                        {statusOptions.map((status) => (
                            <TouchableOpacity key={status.name} style={[{width: 50, height: 50, backgroundColor: status.color}, materialState.color === status.color ? {borderWidth: 2, borderColor: 'black'} : {}]} onPress={() => setMaterialState(prev => ({...prev, color: status.color}))} />
                        ))}
                    </View>
                </View>


                <View style={{marginBottom: 15}}>
                    <Text>Background Color</Text>
                    <View style={{flexDirection: 'row',  justifyContent: 'space-between'}}>
                            <TouchableOpacity 
                                style={[
                                    {padding: 10, borderRadius: 5},
                                    materialState.backgroundColor === '#272532' ? {borderWidth: 2, borderColor: 'black'} : {}
                                ]}
                                onPress={() => {
                                    setMaterialState(prev => ({...prev, backgroundColor: '#272532'}))
                                }}>
                                <Text>Dark</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[
                                    {padding: 10, borderRadius: 5},
                                    materialState.backgroundColor === '#ffffff' ? {borderWidth: 2, borderColor: 'black'} : {}
                                ]}
                                onPress={() => {
                                    setMaterialState(prev => ({...prev, backgroundColor: '#ffffff'}))
                                }}>
                                <Text>Light</Text>
                            </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <View style={{width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 20}}>
                <Button title="Save" onPress={handleSave} />
                <Button title="Reset" onPress={handleReset} />
            </View>
       </ScrollView>
      </Modal>
    )
}