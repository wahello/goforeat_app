import React, { Component } from 'react';
import { Platform, View, ScrollView, Text, StatusBar, SafeAreaView,Image,TouchableOpacity } from 'react-native';
import {Container} from 'native-base';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import { sliderWidth, itemWidth } from '../styles/SliderEntry.style';
import SliderEntry from '../components/SliderEntry';
import styles, { colors } from '../styles/index.style';
import { ENTRIES1, ENTRIES2 } from '../static/entries';
import { scrollInterpolators, animatedStyles } from '../utils/animations';
// utils
import Colors from '../utils/Colors'
import GLOBAL_PARAMS from '../utils/global_params'
import CommonHeader from '../components/CommonHeader';
//api
import api from '../api';

const IS_ANDROID = Platform.OS === 'android';
const SLIDER_1_FIRST_ITEM = 1;

export default class ShopSwiperablePage extends Component {

    constructor (props) {
        super(props);
        this.state = {
            slider1ActiveSlide: SLIDER_1_FIRST_ITEM,
            shopDetail: null
        };
    }
     

    componentWillReceiveProps() {
        console.log(this.props)
    }

    componentDidMount = () => {
        this.getRecommendList();
      };
      //api
      getRecommendList = () => {
        api.recommendOnlineShop().then(data => {
        //   console.log(data);
          if (data.status === 200 && data.data.ro.ok) {
            this.setState({
              shopDetail: data.data.data
            });
          }
        });
      };

    _renderItem ({item, index}) {
        return <SliderEntry data={item} even={(index + 1) % 2 === 0} {...this['props']}/>;
    }

    _renderItemWithParallax ({item, index}, parallaxProps) {
        return (
            <SliderEntry
              data={item}
              even={(index + 1) % 2 === 0}
              parallax={true}
              parallaxProps={parallaxProps}
              
            />
        );
    }

    _renderLightItem ({item, index}) {
        return <SliderEntry data={item} even={false} {...this['props']}/>;
    }

    _renderDarkItem ({item, index}) {
        return <SliderEntry data={item} even={true} {...this['props']}/>;
    }

    mainExample (number, title) {
        const { slider1ActiveSlide } = this.state;

        return this.state.shopDetail !== null ? (
            <View style={[styles.exampleContainer,{marginTop: -15}]}>
                {/*<Text style={[styles.title,{color:'#1a1917'}]}>商家列表</Text>*/}
                <Text style={[styles.subtitle,{color:'#1a1917'}]}>{title}</Text>
                <Carousel
                  ref={c => this._slider1Ref = c}
                  data={this.state.shopDetail}
                  renderItem={this._renderItemWithParallax}
                  sliderWidth={sliderWidth}
                  itemWidth={itemWidth}
                  hasParallaxImages={true}
                  firstItem={SLIDER_1_FIRST_ITEM}
                  inactiveSlideScale={0.94}
                  inactiveSlideOpacity={0.7}
                  // inactiveSlideShift={20}
                  containerCustomStyle={styles.slider}
                  contentContainerCustomStyle={styles.sliderContentContainer}
                  loop={true}
                  loopClonesPerSide={2}
                  autoplay={true}
                  autoplayDelay={500}
                  autoplayInterval={3000}
                  onSnapToItem={(index) => this.setState({ slider1ActiveSlide: index }) }
                />
            </View>
        ) : null
    }

    momentumExample (number, title) {
        return (
            <View style={styles.exampleContainer}>
                <Text style={styles.title}>{`Example ${number}`}</Text>
                <Text style={styles.subtitle}>{title}</Text>
                <Carousel
                  data={ENTRIES2}
                  renderItem={this._renderItem}
                  sliderWidth={sliderWidth}
                  itemWidth={itemWidth}
                  inactiveSlideScale={0.95}
                  inactiveSlideOpacity={1}
                  enableMomentum={true}
                  activeSlideAlignment={'start'}
                  containerCustomStyle={styles.slider}
                  contentContainerCustomStyle={styles.sliderContentContainer}
                  activeAnimationType={'spring'}
                  activeAnimationOptions={{
                      friction: 4,
                      tension: 40
                  }}
                />
            </View>
        );
    }

    layoutExample (number, title, type) {
        const isTinder = type === 'tinder';
        return (
            <View style={[styles.exampleContainer, isTinder ? styles.exampleContainerDark : styles.exampleContainerLight]}>
                <Text style={[styles.title, isTinder ? {} : styles.titleDark]}>商家列表</Text>
                <Text style={[styles.subtitle, isTinder ? {} : styles.titleDark]}>{title}</Text>
                <Carousel
                  data={isTinder ? ENTRIES2 : ENTRIES1}
                  renderItem={isTinder ? this._renderLightItem : this._renderItem}
                  sliderWidth={sliderWidth}
                  itemWidth={itemWidth}
                  containerCustomStyle={styles.slider}
                  contentContainerCustomStyle={styles.sliderContentContainer}
                  layout={type}
                  loop={true}
                />
            </View>
        );
    }

    customExample (number, title, refNumber, renderItemFunc) {
        const isEven = refNumber % 2 === 0;

        // Do not render examples on Android; because of the zIndex bug, they won't work as is
        return !IS_ANDROID ? (
            <View style={[styles.exampleContainer, isEven ? styles.exampleContainerDark : styles.exampleContainerLight]}>
                <Text style={[styles.title, isEven ? {} : styles.titleDark]}>{`Example ${number}`}</Text>
                <Text style={[styles.subtitle, isEven ? {} : styles.titleDark]}>{title}</Text>
                <Carousel
                  data={isEven ? ENTRIES2 : ENTRIES1}
                  renderItem={renderItemFunc}
                  sliderWidth={sliderWidth}
                  itemWidth={itemWidth}
                  containerCustomStyle={styles.slider}
                  contentContainerCustomStyle={styles.sliderContentContainer}
                  scrollInterpolator={scrollInterpolators[`scrollInterpolator${refNumber}`]}
                  slideInterpolatedStyle={animatedStyles[`animatedStyles${refNumber}`]}
                  useScrollView={true}
                />
            </View>
        ) : false;
    }

    // get gradient () {
    //     return (
    //         <LinearGradient
    //           colors={[colors.background1, colors.background2]}
    //           startPoint={{ x: 1, y: 0 }}
    //           endPoint={{ x: 0, y: 1 }}
    //           style={styles.gradient}
    //         />
    //     );
    // }

    render () {
        const example1 = this.mainExample(1, '- 為您推薦 -');
        // const example2 = this.momentumExample(2, 'Momentum | Left-aligned | Active animation');
        // const example3 = this.layoutExample(3, '- 為您推薦 -');
        // const example4 = this.layoutExample(4, '"Tinder-like" layout | Loop', 'tinder');
        // const example5 = this.customExample(5, 'Custom animation 1', 1, this._renderItem);
        // const example6 = this.customExample(6, 'Custom animation 2', 2, this._renderLightItem);
        // const example7 = this.customExample(7, 'Custom animation 3', 3, this._renderDarkItem);
        // const example8 = this.customExample(8, 'Custom animation 4', 4, this._renderLightItem);

        return (
            // <SafeAreaView style={styles.safeArea}>
            //     <View style={styles.container}>
            //         <StatusBar
            //           translucent={true}
            //           backgroundColor={'rgba(0, 0, 0, 0.3)'}
            //           barStyle={'light-content'}
            //         />

                    
            //     </View>
            // </SafeAreaView>
            <Container>
                <CommonHeader title="線上推薦" {...this['props']}/>
                <ScrollView
                      style={styles.scrollview}
                      scrollEventThrottle={200}
                      directionalLockEnabled={true}
                    >
                        { example1 }
                        {/*<View style={{height:GLOBAL_PARAMS._winHeight*0.15,flexDirection:'row',backgroundColor:this.props.screenProps.theme}}>
                          <TouchableOpacity style={{flex:1,justifyContent:'center',alignItems:'center'}}>
                            <Image style={{width:72,height:72}} source={{uri:'dislike'}}/>
                          </TouchableOpacity>
                          <TouchableOpacity style={{flex:1,justifyContent:'center',alignItems:'center'}}>
                            <Image style={{width:72,height:72}} source={{uri:'like'}}/>
                          </TouchableOpacity>
                        </View>*/}
                    </ScrollView>
            </Container>
        );
    }
}
