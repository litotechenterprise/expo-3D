import Slider from '@react-native-community/slider';
import { useCallback } from 'react';
import { Text, View } from 'react-native';


type SliderProps = {
    minimumValue?: number;
    maximumValue: number;
    maximumLimit?: number;
    value: number;
    step?: number;
    onChange?: (value: number) => void;
    onRelease?: (value: number) => void;
    trackColor?: string;
    inactiveTrackColor?: string;
};

export function CoreSlider({
    minimumValue = 0,
    maximumValue,
    maximumLimit,
    value,
    step,
    trackColor,
    inactiveTrackColor,
    onChange,
    onRelease,
}: SliderProps) {
   
  
  


    const onChangeHandler = useCallback(
        (newValue: number) => {
            onChange?.(newValue);
        },
        [onChange],
    );

    const onCompleteHandler = useCallback(
        (newValue: number) => {
            onRelease?.(newValue);
        },
        [onRelease],
    );

    return (
        <View style={{width: '100%', height: 40}} testID="slider-container">
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <View style={{flex: 1, marginRight: 10}}>
                    <Slider
                        style={{ height: 40}}
                        minimumValue={minimumValue}
                        maximumValue={maximumValue}
                        minimumTrackTintColor="#FFFFFF"
                        maximumTrackTintColor="#000000"
                        step={step}
                        value={value}
                        onValueChange={onChangeHandler}
                        onSlidingComplete={onCompleteHandler}
                    />
                </View>
                <Text style={{width: 40, textAlign: 'right'}}>{value.toFixed(2)}</Text>
            </View>
        </View>
    );
}


